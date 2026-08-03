import { getDepositSettings, saveDepositSettings } from '@/lib/telegram';

// 금융결제원 오픈뱅킹 "거래내역조회(핀테크이용번호)" 어댑터.
//   GET https://openapi.openbanking.or.kr/v2.0/account/transaction_list/fin_num
// 이용기관 등록·심사를 거쳐 access_token(scope=inquiry)과 fintech_use_num을 발급받아야
// 동작한다. 발급 전에는 openbanking_enabled=false 상태로 두고 수동 확인으로 운영한다.
//
// 토스뱅크 계좌도 오픈뱅킹 참가기관이므로 이 API로 조회된다(토스뱅크 자체 공개 API는 없음).
// 테스트베드와 운영은 도메인이 다르고 client_id·이용기관코드도 서로 다르다.
// 조합이 어긋나면 authorize 단계에서 "인증요청거부-인증 파라미터 오류"로 거부된다.
const HOSTS = {
  test: 'https://testapi.openbanking.or.kr',
  prod: 'https://openapi.openbanking.or.kr',
} as const;

export function openbankingHost(useTest: boolean) {
  return useTest ? HOSTS.test : HOSTS.prod;
}

export type BankTransaction = {
  /** 거래 식별용 키 — 같은 입금이 두 번 매칭되지 않도록 예약에 저장한다. */
  ref: string;
  tranDate: string; // YYYYMMDD
  tranTime: string; // HHMMSS
  /** 통장인자내용 = 대개 입금자명 */
  printedContent: string;
  amount: number;
};

type ApiResponse = {
  rsp_code?: string;
  rsp_message?: string;
  res_list?: {
    tran_date?: string;
    tran_time?: string;
    inout_type?: string;
    printed_content?: string;
    print_content?: string;
    tran_amt?: string;
    after_balance_amt?: string;
  }[];
};

// ---------- OAuth (사용자인증 → 토큰 발급) ----------

/**
 * CSRF 방지용 state. 오픈뱅킹 명세상 **32Byte 고정**이며,
 * 길이가 다르면 authorize가 "인증요청거부-인증 파라미터 오류"로 거부된다.
 */
export function makeOpenbankingState() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let out = '';
  for (let i = 0; i < 32; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

/**
 * 사용자인증 화면 주소.
 * 여기서 계좌 인증을 마치면 등록해둔 Callback URL로 `code`가 붙어 돌아온다.
 * scope는 이용기관이 신청한 서비스와 일치해야 하며, 거래내역 조회만 쓰면 'login inquiry'.
 * auth_type: 0=최초인증, 1=재인증, 2=인증생략.
 */
export function buildOpenbankingAuthorizeUrl(opts: {
  clientId: string;
  redirectUri: string;
  scope: string;
  useTest: boolean;
}) {
  // URLSearchParams는 공백을 '+'로 인코딩하는데, 오픈뱅킹 명세 예시는 '%20'을 쓴다.
  // scope가 공백으로 구분되므로 encodeURIComponent로 직접 조립한다.
  const params: [string, string][] = [
    ['response_type', 'code'],
    ['client_id', opts.clientId],
    ['redirect_uri', opts.redirectUri],
    ['scope', opts.scope.trim().replace(/\s+/g, ' ')],
    // 명세상 32Byte 고정이라 호출부에서 넘기지 않고 여기서 항상 규격에 맞춰 만든다.
    ['state', makeOpenbankingState()],
    ['auth_type', '0'],
  ];
  const query = params.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
  return `${openbankingHost(opts.useTest)}/oauth/2.0/authorize?${query}`;
}

type TokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  user_seq_no?: string;
  rsp_code?: string;
  rsp_message?: string;
};

/** Callback으로 받은 code를 access_token / refresh_token으로 교환해 저장한다. */
export async function exchangeOpenbankingCode(code: string) {
  const s = await getDepositSettings();
  if (!s.openbankingClientId || !s.openbankingClientSecret || !s.openbankingRedirectUri) {
    return {
      ok: false as const,
      error: 'client_id·client_secret·Callback URL을 먼저 저장해주세요.',
    };
  }

  const body = new URLSearchParams({
    code,
    client_id: s.openbankingClientId,
    client_secret: s.openbankingClientSecret,
    redirect_uri: s.openbankingRedirectUri,
    grant_type: 'authorization_code',
  });

  try {
    const res = await fetch(`${openbankingHost(s.openbankingUseTest)}/oauth/2.0/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      cache: 'no-store',
    });
    const json = (await res.json()) as TokenResponse;
    if (!json.access_token) {
      return {
        ok: false as const,
        error: `${json.rsp_code ?? 'ERR'} ${json.rsp_message ?? '토큰 발급에 실패했습니다.'}`,
      };
    }

    await saveDepositSettings({
      openbankingAccessToken: json.access_token,
      openbankingRefreshToken: json.refresh_token ?? '',
      openbankingUserSeqNo: json.user_seq_no ?? '',
      openbankingTokenExpiresAt: json.expires_in
        ? new Date(Date.now() + json.expires_in * 1000).toISOString()
        : null,
    });

    return { ok: true as const, userSeqNo: json.user_seq_no ?? '' };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : '토큰 발급 중 오류가 발생했습니다.',
    };
  }
}

/**
 * 등록된 계좌 목록을 조회해 핀테크이용번호(fintech_use_num) 후보를 돌려준다.
 * 어느 계좌로 입금을 받을지 관리자 화면에서 고를 수 있게 하기 위함.
 */
export async function fetchOpenbankingAccounts() {
  const s = await getDepositSettings();
  if (!s.openbankingAccessToken || !s.openbankingUserSeqNo) {
    return { ok: false as const, error: '먼저 오픈뱅킹 연결을 완료해주세요.' };
  }

  try {
    const res = await fetch(
      `${openbankingHost(s.openbankingUseTest)}/v2.0/user/me?user_seq_no=${encodeURIComponent(s.openbankingUserSeqNo)}`,
      {
        headers: { Authorization: `Bearer ${s.openbankingAccessToken}` },
        cache: 'no-store',
      },
    );
    const json = (await res.json()) as {
      rsp_code?: string;
      rsp_message?: string;
      res_list?: {
        fintech_use_num?: string;
        bank_name?: string;
        account_num_masked?: string;
        account_alias?: string;
      }[];
    };
    if (json.rsp_code !== 'A0000') {
      return {
        ok: false as const,
        error: `${json.rsp_code ?? 'ERR'} ${json.rsp_message ?? '계좌 조회에 실패했습니다.'}`,
      };
    }
    return {
      ok: true as const,
      accounts: (json.res_list ?? []).map((a) => ({
        fintechUseNum: a.fintech_use_num ?? '',
        bankName: a.bank_name ?? '',
        accountMasked: a.account_num_masked ?? '',
        alias: a.account_alias ?? '',
      })),
    };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : '계좌 조회 중 오류가 발생했습니다.',
    };
  }
}

/** 은행거래고유번호: 이용기관코드(9) + U + 일련번호(9). 요청마다 유일해야 한다. */
function makeBankTranId(clientUseCode: string) {
  const serial = Math.random().toString(36).slice(2, 11).toUpperCase().padEnd(9, '0');
  return `${clientUseCode.padEnd(9, '0').slice(0, 9)}U${serial}`;
}

function yyyymmdd(d: Date) {
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * 최근 `days`일 입금 내역을 조회한다.
 * 설정이 없거나 비활성이면 `configured: false`로 조용히 반환 — 호출부가 수동 확인으로 넘어간다.
 */
export async function fetchRecentDeposits(
  days = 3,
): Promise<
  | { configured: false }
  | { configured: true; ok: true; transactions: BankTransaction[] }
  | { configured: true; ok: false; error: string }
> {
  const s = await getDepositSettings();
  if (!s.openbankingEnabled || !s.openbankingAccessToken || !s.openbankingFintechUseNum) {
    return { configured: false };
  }

  const now = new Date();
  const from = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const params = new URLSearchParams({
    bank_tran_id: makeBankTranId(s.openbankingClientUseCode || 'M000000000'),
    fintech_use_num: s.openbankingFintechUseNum,
    inquiry_type: 'I', // 입금만
    inquiry_base: 'D', // 일자 기준
    from_date: yyyymmdd(from),
    to_date: yyyymmdd(now),
    sort_order: 'D', // 최신순
    tran_dtime: `${yyyymmdd(now)}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`,
  });

  try {
    const res = await fetch(
      `${openbankingHost(s.openbankingUseTest)}/v2.0/account/transaction_list/fin_num?${params}`,
      {
        headers: { Authorization: `Bearer ${s.openbankingAccessToken}` },
        cache: 'no-store',
      },
    );
    const json = (await res.json()) as ApiResponse;

    // 정상 응답코드는 A0000. 그 외에는 사유를 그대로 올려 관리자 화면에 보여준다.
    if (json.rsp_code !== 'A0000') {
      return {
        configured: true,
        ok: false,
        error: `${json.rsp_code ?? 'ERR'} ${json.rsp_message ?? '오픈뱅킹 조회에 실패했습니다.'}`,
      };
    }

    const transactions: BankTransaction[] = (json.res_list ?? [])
      .filter((r) => r.inout_type === '입금')
      .map((r) => {
        const tranDate = r.tran_date ?? '';
        const tranTime = r.tran_time ?? '';
        // 명세상 필드명이 print_content / printed_content 두 가지로 표기되어 둘 다 받는다.
        const printedContent = (r.printed_content ?? r.print_content ?? '').trim();
        const amount = Number(r.tran_amt ?? 0) || 0;
        return {
          ref: `${tranDate}${tranTime}-${amount}-${printedContent}`,
          tranDate,
          tranTime,
          printedContent,
          amount,
        };
      });

    return { configured: true, ok: true, transactions };
  } catch (err) {
    return {
      configured: true,
      ok: false,
      error: err instanceof Error ? err.message : '오픈뱅킹 조회 중 오류가 발생했습니다.',
    };
  }
}

/** 입금자명 비교용 정규화 — 공백/괄호 제거 후 비교한다. */
export function normalizeDepositorName(v: string) {
  return v.replace(/[\s()[\]-]/g, '').toLowerCase();
}

/**
 * 입금 대기 예약과 입금 내역을 매칭.
 * 입금자명이 일치하고 금액이 예약금 이상인 첫 거래를 고른다.
 * 이미 다른 예약에 쓰인 거래(usedRefs)는 건너뛴다.
 */
export function matchDeposit(
  pending: { depositorName: string; depositAmount: number },
  transactions: BankTransaction[],
  usedRefs: Set<string>,
) {
  const wanted = normalizeDepositorName(pending.depositorName);
  if (!wanted) return null;
  return (
    transactions.find(
      (t) =>
        !usedRefs.has(t.ref) &&
        t.amount >= pending.depositAmount &&
        normalizeDepositorName(t.printedContent).includes(wanted),
    ) ?? null
  );
}
