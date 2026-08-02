'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { ZONE_TYPE_LABELS, type ZoneType } from '@/lib/cabana-pricing';
import { sendCustomerReservationAlimtalk } from '@/lib/aligo';
import {
  getDepositSettings,
  saveDepositSettings,
  sendTelegramNotification,
  sendTelegramTest,
  type DepositSettings,
} from '@/lib/telegram';
import {
  fetchRecentDeposits,
  matchDeposit,
  buildOpenbankingAuthorizeUrl,
  fetchOpenbankingAccounts,
} from '@/lib/openbanking';

export type PendingDeposit = {
  id: string;
  reservationNo: string;
  reservationDate: string;
  zoneLabel: string;
  timeType: string;
  cabanaNo: number;
  name: string;
  phone: string;
  depositorName: string;
  depositAmount: number;
  createdAt: string;
};

function zoneLabel(zoneType: string) {
  return ZONE_TYPE_LABELS[zoneType as ZoneType] ?? zoneType;
}

// ---------- 설정 ----------

export async function loadDepositSettings() {
  await requireAdmin();
  return getDepositSettings();
}

export async function updateDepositSettings(patch: Partial<DepositSettings>) {
  await requireAdmin();
  await saveDepositSettings(patch);
  revalidatePath('/admin/deposit');
}

export async function testTelegram() {
  await requireAdmin();
  return sendTelegramTest();
}

/**
 * 오픈뱅킹 사용자인증 화면 주소를 만들어 돌려준다.
 * 관리자가 이 주소로 이동해 계좌 인증을 마치면 Callback URL로 code가 돌아온다.
 */
export async function getOpenbankingAuthorizeUrl() {
  await requireAdmin();
  const s = await getDepositSettings();
  if (!s.openbankingClientId || !s.openbankingRedirectUri) {
    return { ok: false as const, error: 'client_id와 Callback URL을 먼저 저장해주세요.' };
  }
  return {
    ok: true as const,
    url: buildOpenbankingAuthorizeUrl({
      clientId: s.openbankingClientId,
      redirectUri: s.openbankingRedirectUri,
      scope: s.openbankingScope,
      useTest: s.openbankingUseTest,
    }),
  };
}

/** 연결된 계좌 목록 조회 — 입금받을 계좌의 핀테크이용번호를 고르기 위함. */
export async function listOpenbankingAccounts() {
  await requireAdmin();
  return fetchOpenbankingAccounts();
}

/** 예약금 정책(사용 여부·금액·입금 계좌)은 site_settings에 저장. */
export async function saveDepositPolicy(data: {
  enabled: boolean;
  amount: number;
  bankName: string;
  accountNo: string;
  holder: string;
  guide: string;
}) {
  await requireAdmin();
  if (data.amount < 0) throw new Error('예약금은 0원 이상이어야 합니다.');
  if (data.enabled && (!data.bankName.trim() || !data.accountNo.trim())) {
    throw new Error('예약금을 사용하려면 입금 은행과 계좌번호를 입력해주세요.');
  }

  const admin = createAdminClient();
  const now = new Date().toISOString();
  const { error } = await admin.from('site_settings').upsert([
    { key: 'deposit_enabled', value: String(data.enabled), updated_at: now },
    { key: 'deposit_amount', value: String(data.amount), updated_at: now },
    { key: 'deposit_bank_name', value: data.bankName.trim(), updated_at: now },
    { key: 'deposit_account_no', value: data.accountNo.trim(), updated_at: now },
    { key: 'deposit_holder', value: data.holder.trim(), updated_at: now },
    { key: 'deposit_guide', value: data.guide.trim(), updated_at: now },
  ]);
  if (error) throw new Error(error.message);

  revalidatePath('/admin/deposit');
  revalidatePath('/');
}

// ---------- 입금 대기 목록 ----------

export async function getPendingDeposits(): Promise<PendingDeposit[]> {
  await requireAdmin();
  const admin = createAdminClient();
  const { data } = await admin
    .from('cabana_reservations')
    .select('*')
    .eq('deposit_status', 'pending')
    .order('created_at', { ascending: false })
    .limit(200);

  return (data ?? []).map((r) => ({
    id: r.id,
    reservationNo: r.reservation_no,
    reservationDate: r.reservation_date,
    zoneLabel: zoneLabel(r.zone_type),
    timeType: r.time_type,
    cabanaNo: r.cabana_no,
    name: r.name,
    phone: r.phone,
    depositorName: r.depositor_name || r.name,
    depositAmount: r.deposit_amount,
    createdAt: r.created_at,
  }));
}

/**
 * 입금 확인 처리 — 예약을 확정하고 고객 알림톡 + 관리자 텔레그램을 발송한다.
 * txRef는 오픈뱅킹 자동 매칭 시 어떤 거래로 확인했는지 기록하는 값(수동 확인이면 비움).
 */
export async function confirmDeposit(id: string, txRef?: string) {
  await requireAdmin();
  const admin = createAdminClient();

  const { data: row } = await admin
    .from('cabana_reservations')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (!row) throw new Error('예약을 찾을 수 없습니다.');
  if (row.deposit_status === 'paid') return { alreadyPaid: true as const };

  const { error } = await admin
    .from('cabana_reservations')
    .update({
      deposit_status: 'paid',
      deposit_paid_at: new Date().toISOString(),
      deposit_tx_ref: txRef ?? null,
    })
    .eq('id', id);
  if (error) throw new Error(error.message);

  const label = `${zoneLabel(row.zone_type)} ${row.time_type} ${row.cabana_no}번`;

  await sendCustomerReservationAlimtalk(row.phone, {
    name: row.name,
    date: row.reservation_date,
    timeType: label,
    reservationNo: row.reservation_no,
  });

  await sendTelegramNotification(
    [
      '✅ <b>예약금 입금 확인</b>',
      `${row.name}님 · ${label}`,
      `예약일자: ${row.reservation_date}`,
      `입금액: ${row.deposit_amount.toLocaleString('ko-KR')}원`,
      `예약번호: ${row.reservation_no}`,
      txRef ? '(오픈뱅킹 자동 매칭)' : '(관리자 수동 확인)',
    ].join('\n')
  );

  revalidatePath('/admin/deposit');
  revalidatePath('/admin/cabana-reservations');
  return { alreadyPaid: false as const };
}

/** 입금이 오지 않아 자리를 풀 때 — 예약 자체를 삭제해 슬롯을 반환한다. */
export async function releaseUnpaidDeposit(id: string) {
  await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin
    .from('cabana_reservations')
    .delete()
    .eq('id', id)
    .eq('deposit_status', 'pending');
  if (error) throw new Error(error.message);

  revalidatePath('/admin/deposit');
  revalidatePath('/admin/cabana-reservations');
}

// ---------- 오픈뱅킹 자동 매칭 ----------

/**
 * 오픈뱅킹 거래내역을 조회해 입금 대기 예약과 매칭하고, 맞으면 자동 확정한다.
 * 이용기관 키가 없으면 configured:false로 반환하고 아무것도 바꾸지 않는다.
 */
export async function syncDepositsFromBank() {
  await requireAdmin();

  const result = await fetchRecentDeposits(3);
  if (!result.configured) {
    return {
      ok: false as const,
      configured: false as const,
      error: '오픈뱅킹 연동이 설정되어 있지 않습니다. 수동 확인을 이용해주세요.',
    };
  }
  if (!result.ok) return { ok: false as const, configured: true as const, error: result.error };

  const pending = await getPendingDeposits();
  const admin = createAdminClient();

  // 이미 다른 예약에 매칭된 거래는 재사용하지 않는다.
  const { data: usedRows } = await admin
    .from('cabana_reservations')
    .select('deposit_tx_ref')
    .not('deposit_tx_ref', 'is', null);
  const usedRefs = new Set((usedRows ?? []).map((r) => r.deposit_tx_ref as string));

  const matched: string[] = [];
  for (const p of pending) {
    const tx = matchDeposit(
      { depositorName: p.depositorName, depositAmount: p.depositAmount },
      result.transactions,
      usedRefs
    );
    if (!tx) continue;
    usedRefs.add(tx.ref);
    await confirmDeposit(p.id, tx.ref);
    matched.push(`${p.name} · ${p.reservationNo}`);
  }

  return {
    ok: true as const,
    configured: true as const,
    checked: result.transactions.length,
    matched,
  };
}
