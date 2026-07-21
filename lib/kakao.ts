import { createAdminClient } from '@/lib/supabase/admin';

const AUTHORIZE_URL = 'https://kauth.kakao.com/oauth/authorize';
const TOKEN_URL = 'https://kauth.kakao.com/oauth/token';
const SEND_TO_ME_URL = 'https://kapi.kakao.com/v2/api/talk/memo/default/send';

async function getSettingsRow() {
  const admin = createAdminClient();
  const { data } = await admin
    .from('kakao_notify_settings')
    .select('*')
    .eq('id', 1)
    .maybeSingle();
  return data;
}

export async function getKakaoConfig() {
  const row = await getSettingsRow();
  return {
    restApiKey: row?.rest_api_key ?? '',
    redirectUri: row?.redirect_uri ?? '',
    connected: !!(row?.access_token && row?.refresh_token),
  };
}

export async function saveKakaoConfig(restApiKey: string, redirectUri: string) {
  const admin = createAdminClient();
  const { error } = await admin
    .from('kakao_notify_settings')
    .upsert({
      id: 1,
      rest_api_key: restApiKey,
      redirect_uri: redirectUri,
      updated_at: new Date().toISOString(),
    });
  if (error) throw new Error(error.message);
}

export async function disconnectKakao() {
  const admin = createAdminClient();
  const { error } = await admin
    .from('kakao_notify_settings')
    .update({
      access_token: null,
      refresh_token: null,
      token_expires_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', 1);
  if (error) throw new Error(error.message);
}

export function buildKakaoAuthorizeUrl(restApiKey: string, redirectUri: string) {
  const params = new URLSearchParams({
    client_id: restApiKey,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'talk_message',
  });
  return `${AUTHORIZE_URL}?${params.toString()}`;
}

async function saveTokens(accessToken: string, refreshToken: string, expiresInSec: number) {
  const admin = createAdminClient();
  const tokenExpiresAt = new Date(Date.now() + expiresInSec * 1000).toISOString();
  const { error } = await admin
    .from('kakao_notify_settings')
    .update({
      access_token: accessToken,
      refresh_token: refreshToken,
      token_expires_at: tokenExpiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq('id', 1);
  if (error) throw new Error(error.message);
}

export async function exchangeKakaoCode(code: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const row = await getSettingsRow();
  if (!row?.rest_api_key || !row?.redirect_uri) {
    return { ok: false, error: 'REST API 키/Redirect URI가 먼저 저장되어 있어야 합니다.' };
  }

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: row.rest_api_key,
      redirect_uri: row.redirect_uri,
      code,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    return { ok: false, error: data.error_description ?? '토큰 발급에 실패했습니다.' };
  }

  await saveTokens(data.access_token, data.refresh_token, data.expires_in);
  return { ok: true };
}

async function getValidAccessToken(): Promise<string | null> {
  const row = await getSettingsRow();
  if (!row?.rest_api_key || !row?.access_token || !row?.refresh_token) return null;

  const expiresAt = row.token_expires_at ? new Date(row.token_expires_at).getTime() : 0;
  if (Date.now() < expiresAt - 60_000) return row.access_token;

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: row.rest_api_key,
      refresh_token: row.refresh_token,
    }),
  });

  if (!res.ok) return null;
  const data = await res.json();
  const newRefreshToken = data.refresh_token ?? row.refresh_token;
  await saveTokens(data.access_token, newRefreshToken, data.expires_in);
  return data.access_token as string;
}

async function sendToMe(accessToken: string, message: string) {
  const templateObject = {
    object_type: 'text',
    text: message,
    link: { web_url: '', mobile_web_url: '' },
  };

  const res = await fetch(SEND_TO_ME_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ template_object: JSON.stringify(templateObject) }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.msg ?? `카카오톡 발송 실패 (${res.status})`);
  }
}

// 카카오 연동(REST API 키/토큰)이 안 되어 있으면 조용히 건너뜁니다.
// 발송 실패가 예약 등 핵심 기능을 막지 않도록 에러를 삼킵니다.
export async function sendKakaoNotification(message: string) {
  try {
    const accessToken = await getValidAccessToken();
    if (!accessToken) return;
    await sendToMe(accessToken, message);
  } catch (err) {
    console.error('카카오톡 알림 발송 실패:', err);
  }
}

// 관리자 설정 화면의 "테스트 메시지 보내기" 버튼에서 사용 — 실패 사유를 화면에 보여줘야 하므로
// sendKakaoNotification과 달리 에러를 던집니다.
export async function sendKakaoTestMessage() {
  const accessToken = await getValidAccessToken();
  if (!accessToken) {
    throw new Error('카카오 계정이 연동되어 있지 않습니다. 먼저 연동을 진행해주세요.');
  }
  await sendToMe(accessToken, '[테스트] 송도국제캠핑장 물놀이장 카카오톡 알림이 정상적으로 연동되었습니다.');
}
