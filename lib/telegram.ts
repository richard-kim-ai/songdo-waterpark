import { createAdminClient } from '@/lib/supabase/admin';

// 텔레그램 봇 알림. Bot API는 무료이며 발송 건수 제한이 사실상 없다.
// 봇 토큰은 @BotFather로 봇을 만들면 발급되고, chat_id는 그 봇과 대화를 시작한 뒤
// https://api.telegram.org/bot<토큰>/getUpdates 를 열면 확인할 수 있다.
const API_BASE = 'https://api.telegram.org';

export type DepositSettings = {
  telegramBotToken: string;
  telegramChatId: string;
  openbankingAccessToken: string;
  openbankingFintechUseNum: string;
  openbankingClientUseCode: string;
  openbankingEnabled: boolean;
  // OAuth 연동값
  openbankingClientId: string;
  openbankingClientSecret: string;
  openbankingRedirectUri: string;
  openbankingRefreshToken: string;
  openbankingUserSeqNo: string;
  openbankingTokenExpiresAt: string | null;
  /** true면 테스트베드(testapi), false면 운영(openapi) 도메인을 사용 */
  openbankingUseTest: boolean;
  /** 이용기관이 실제 신청한 서비스와 일치해야 하는 scope */
  openbankingScope: string;
};

export async function getDepositSettings(): Promise<DepositSettings> {
  const admin = createAdminClient();
  const { data } = await admin.from('deposit_settings').select('*').eq('id', 1).maybeSingle();
  return {
    telegramBotToken: data?.telegram_bot_token ?? '',
    telegramChatId: data?.telegram_chat_id ?? '',
    openbankingAccessToken: data?.openbanking_access_token ?? '',
    openbankingFintechUseNum: data?.openbanking_fintech_use_num ?? '',
    openbankingClientUseCode: data?.openbanking_client_use_code ?? '',
    openbankingEnabled: data?.openbanking_enabled ?? false,
    openbankingClientId: data?.openbanking_client_id ?? '',
    openbankingClientSecret: data?.openbanking_client_secret ?? '',
    openbankingRedirectUri: data?.openbanking_redirect_uri ?? '',
    openbankingRefreshToken: data?.openbanking_refresh_token ?? '',
    openbankingUserSeqNo: data?.openbanking_user_seq_no ?? '',
    openbankingTokenExpiresAt: data?.openbanking_token_expires_at ?? null,
    openbankingUseTest: data?.openbanking_use_test ?? true,
    openbankingScope: data?.openbanking_scope || 'login inquiry',
  };
}

export async function saveDepositSettings(patch: Partial<DepositSettings>) {
  const admin = createAdminClient();
  const row: Record<string, unknown> = { id: 1, updated_at: new Date().toISOString() };
  if (patch.telegramBotToken !== undefined) row.telegram_bot_token = patch.telegramBotToken.trim();
  if (patch.telegramChatId !== undefined) row.telegram_chat_id = patch.telegramChatId.trim();
  if (patch.openbankingAccessToken !== undefined)
    row.openbanking_access_token = patch.openbankingAccessToken.trim();
  if (patch.openbankingFintechUseNum !== undefined)
    row.openbanking_fintech_use_num = patch.openbankingFintechUseNum.trim();
  if (patch.openbankingClientUseCode !== undefined)
    row.openbanking_client_use_code = patch.openbankingClientUseCode.trim();
  if (patch.openbankingEnabled !== undefined) row.openbanking_enabled = patch.openbankingEnabled;
  if (patch.openbankingClientId !== undefined)
    row.openbanking_client_id = patch.openbankingClientId.trim();
  if (patch.openbankingClientSecret !== undefined)
    row.openbanking_client_secret = patch.openbankingClientSecret.trim();
  if (patch.openbankingRedirectUri !== undefined)
    row.openbanking_redirect_uri = patch.openbankingRedirectUri.trim();
  if (patch.openbankingRefreshToken !== undefined)
    row.openbanking_refresh_token = patch.openbankingRefreshToken.trim();
  if (patch.openbankingUserSeqNo !== undefined)
    row.openbanking_user_seq_no = patch.openbankingUserSeqNo.trim();
  if (patch.openbankingTokenExpiresAt !== undefined)
    row.openbanking_token_expires_at = patch.openbankingTokenExpiresAt;
  if (patch.openbankingUseTest !== undefined) row.openbanking_use_test = patch.openbankingUseTest;
  if (patch.openbankingScope !== undefined)
    row.openbanking_scope = patch.openbankingScope.trim() || 'login inquiry';

  const { error } = await admin.from('deposit_settings').upsert(row);
  if (error) throw new Error(error.message);
}

/**
 * 관리자 텔레그램으로 알림 발송.
 * 설정이 비어 있으면 조용히 건너뛴다 — 알림 실패가 예약 처리를 막아서는 안 된다.
 */
export async function sendTelegramNotification(text: string) {
  const { telegramBotToken, telegramChatId } = await getDepositSettings();
  if (!telegramBotToken || !telegramChatId) return { ok: false, skipped: true as const };

  try {
    const res = await fetch(`${API_BASE}/bot${telegramBotToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: telegramChatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });
    const json = (await res.json()) as { ok?: boolean; description?: string };
    if (!json.ok) return { ok: false, error: json.description ?? '텔레그램 발송에 실패했습니다.' };
    return { ok: true as const };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : '텔레그램 발송 중 오류' };
  }
}

/** 관리자 설정 화면의 "테스트 발송" 버튼용 — 실패 사유를 그대로 돌려준다. */
export async function sendTelegramTest() {
  const { telegramBotToken, telegramChatId } = await getDepositSettings();
  if (!telegramBotToken || !telegramChatId) {
    return { ok: false as const, error: '봇 토큰과 chat_id를 먼저 저장해주세요.' };
  }
  const res = await sendTelegramNotification(
    '✅ <b>송도 물놀이장</b>\n텔레그램 알림이 정상적으로 연결되었습니다.'
  );
  return res.ok ? { ok: true as const } : { ok: false as const, error: res.error ?? '발송 실패' };
}
