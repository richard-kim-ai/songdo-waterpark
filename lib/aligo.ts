import { createAdminClient } from '@/lib/supabase/admin';

const ALIMTALK_SEND_URL = 'https://kakaoapi.aligo.in/akv10/alimtalk/send/';

export const DEFAULT_MESSAGE_TEMPLATE = `[송도국제캠핑장 물놀이장]
#{이름}님의 케노피 예약이 접수되었습니다.

예약일자: #{예약일자}
이용권: #{이용권}
예약번호: #{예약번호}

예약번호를 가지고 현장에서 결제 시 케노피 위치는 선착순으로 배정됩니다.`;

const SUBJECT = '케노피 예약 접수 안내';

async function getSettingsRow() {
  const admin = createAdminClient();
  const { data } = await admin
    .from('aligo_notify_settings')
    .select('*')
    .eq('id', 1)
    .maybeSingle();
  return data;
}

export async function getAligoConfig() {
  const row = await getSettingsRow();
  return {
    apiKey: row?.api_key ?? '',
    userId: row?.user_id ?? '',
    sender: row?.sender ?? '',
    senderKey: row?.sender_key ?? '',
    tplCode: row?.tpl_code ?? '',
    messageTemplate: row?.message_template || DEFAULT_MESSAGE_TEMPLATE,
    useSmsFallback: row?.use_sms_fallback ?? true,
    configured: !!(row?.api_key && row?.user_id && row?.sender && row?.sender_key && row?.tpl_code),
  };
}

export async function saveAligoConfig(config: {
  apiKey: string;
  userId: string;
  sender: string;
  senderKey: string;
  tplCode: string;
  messageTemplate: string;
  useSmsFallback: boolean;
}) {
  const admin = createAdminClient();
  const { error } = await admin.from('aligo_notify_settings').upsert({
    id: 1,
    api_key: config.apiKey,
    user_id: config.userId,
    sender: config.sender,
    sender_key: config.senderKey,
    tpl_code: config.tplCode,
    message_template: config.messageTemplate,
    use_sms_fallback: config.useSmsFallback,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
}

function renderTemplate(template: string, vars: Record<string, string>) {
  return Object.entries(vars).reduce(
    (text, [key, value]) => text.replaceAll(`#{${key}}`, value),
    template
  );
}

type ReservationVars = {
  name: string;
  date: string;
  timeType: string;
  reservationNo: string;
};

function buildVars({ name, date, timeType, reservationNo }: ReservationVars) {
  return {
    이름: name,
    예약일자: date,
    이용권: timeType,
    예약번호: reservationNo,
  };
}

async function sendAlimtalk(phone: string, vars: ReservationVars) {
  const config = await getAligoConfig();
  if (!config.configured) {
    throw new Error('알리고 API 키/발신프로필/템플릿 코드가 아직 저장되어 있지 않습니다.');
  }

  const message = renderTemplate(config.messageTemplate, buildVars(vars));
  const smsMessage = `[송도국제캠핑장 물놀이장] ${vars.name}님의 케노피 예약이 접수되었습니다. 예약일자 ${vars.date} / ${vars.timeType} / 예약번호 ${vars.reservationNo}. 예약번호로 현장 결제 시 케노피 위치는 선착순 배정됩니다.`;

  const body = new URLSearchParams({
    apikey: config.apiKey,
    userid: config.userId,
    senderkey: config.senderKey,
    tpl_code: config.tplCode,
    sender: config.sender,
    receiver_1: phone,
    recvname_1: vars.name,
    subject_1: SUBJECT,
    message_1: message,
  });

  if (config.useSmsFallback) {
    body.set('failover', 'Y');
    body.set('fsubject_1', SUBJECT);
    body.set('fmessage_1', smsMessage);
  }

  const res = await fetch(ALIMTALK_SEND_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  const data = await res.json().catch(() => null);
  if (!res.ok || !data || data.code !== 0) {
    throw new Error(data?.message ?? `알림톡 발송 실패 (${res.status})`);
  }
}

// 알리고 연동이 안 되어 있거나 발송에 실패해도 예약 등 핵심 기능을 막지 않도록
// 에러를 삼킵니다 (관리자용 sendKakaoNotification과 동일한 fail-silent 정책).
export async function sendCustomerReservationAlimtalk(phone: string, vars: ReservationVars) {
  try {
    await sendAlimtalk(phone, vars);
  } catch (err) {
    console.error('고객 알림톡 발송 실패:', err);
  }
}

// 관리자 설정 화면의 "테스트 발송" 버튼에서 사용 — 실패 사유를 화면에 보여줘야 하므로
// sendCustomerReservationAlimtalk와 달리 에러를 던집니다.
export async function sendAligoTestMessage(testPhone: string) {
  await sendAlimtalk(testPhone, {
    name: '테스트',
    date: new Date().toISOString().slice(0, 10),
    timeType: '주간',
    reservationNo: 'TEST0000',
  });
}
