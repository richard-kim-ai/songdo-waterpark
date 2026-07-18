import nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) return null;

  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
    });
  }
  return transporter;
}

// Gmail 앱 비밀번호 설정(GMAIL_USER/GMAIL_APP_PASSWORD)이 없으면 조용히 건너뜁니다.
// 메일 발송 실패가 예약/문의 등 핵심 기능을 막지 않도록 에러를 삼킵니다.
export async function sendNotificationMail(subject: string, text: string) {
  const t = getTransporter();
  if (!t) return;

  const to = process.env.NOTIFY_EMAIL || process.env.GMAIL_USER;

  try {
    await t.sendMail({ from: process.env.GMAIL_USER, to, subject, text });
  } catch (err) {
    console.error('알림 메일 발송 실패:', err);
  }
}
