import { getDepositSettings } from '@/lib/telegram';

// 금융결제원 오픈뱅킹 "거래내역조회(핀테크이용번호)" 어댑터.
//   GET https://openapi.openbanking.or.kr/v2.0/account/transaction_list/fin_num
// 이용기관 등록·심사를 거쳐 access_token(scope=inquiry)과 fintech_use_num을 발급받아야
// 동작한다. 발급 전에는 openbanking_enabled=false 상태로 두고 수동 확인으로 운영한다.
//
// 토스뱅크 계좌도 오픈뱅킹 참가기관이므로 이 API로 조회된다(토스뱅크 자체 공개 API는 없음).
const BASE_URL = 'https://openapi.openbanking.or.kr/v2.0';

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
  days = 3
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
    const res = await fetch(`${BASE_URL}/account/transaction_list/fin_num?${params}`, {
      headers: { Authorization: `Bearer ${s.openbankingAccessToken}` },
      cache: 'no-store',
    });
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
  usedRefs: Set<string>
) {
  const wanted = normalizeDepositorName(pending.depositorName);
  if (!wanted) return null;
  return (
    transactions.find(
      (t) =>
        !usedRefs.has(t.ref) &&
        t.amount >= pending.depositAmount &&
        normalizeDepositorName(t.printedContent).includes(wanted)
    ) ?? null
  );
}
