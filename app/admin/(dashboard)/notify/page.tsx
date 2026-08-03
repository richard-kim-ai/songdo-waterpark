import { requirePagePermission } from '@/lib/admin/auth';
import { getKakaoConfig } from '@/lib/kakao';
import { getAligoConfig } from '@/lib/aligo';
import { getDepositSettings } from '@/lib/telegram';
import NotifyTabs from '../NotifyTabs';
import TelegramSettings from '../TelegramSettings';
import KakaoNotifySettings from '../KakaoNotifySettings';
import AligoNotifySettings from '../AligoNotifySettings';

export const dynamic = 'force-dynamic';

function Guide({
  title,
  steps,
}: {
  title: string;
  steps: { title: string; body: React.ReactNode }[];
}) {
  return (
    <section className="bg-white rounded-xl shadow p-4 md:p-6 mb-6">
      <h2 className="font-bold text-gray-900 mb-4">{title}</h2>
      <ol className="space-y-4">
        {steps.map((step) => (
          <li key={step.title} className="text-sm">
            <p className="font-semibold text-gray-800 mb-1">{step.title}</p>
            <p className="text-gray-600 leading-relaxed">{step.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

export default async function NotifyAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ kakao_connected?: string; kakao_error?: string }>;
}) {
  await requirePagePermission('notify');

  const [kakao, aligo, deposit, params] = await Promise.all([
    getKakaoConfig(),
    getAligoConfig(),
    getDepositSettings(),
    searchParams,
  ]);

  // 카카오 연동 콜백으로 돌아온 경우 카카오 탭을 먼저 보여준다.
  const initialTab = params.kakao_connected || params.kakao_error ? 'kakao' : 'telegram';

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">알림 설정</h1>
        <p className="text-gray-500">
          예약 접수·입금 관련 알림을 어디로 받을지 한 화면에서 관리합니다. 텔레그램과 카카오톡은
          관리자 본인에게 무료로 오고, 알림톡은 고객 휴대폰으로 발송되며 건당 요금이 발생합니다.
        </p>
      </div>

      <NotifyTabs
        initialTab={initialTab}
        telegramPanel={
          <>
            <Guide
              title="텔레그램 연동 방법 (무료)"
              steps={[
                {
                  title: '1. 봇 만들기',
                  body: '텔레그램에서 @BotFather를 찾아 /newbot 을 보내고 안내에 따라 봇을 만듭니다. 완료되면 봇 토큰이 발급됩니다.',
                },
                {
                  title: '2. 봇과 대화 시작',
                  body: '만든 봇을 검색해 대화방을 열고 아무 메시지나 한 번 보냅니다. (이 과정을 거쳐야 봇이 메시지를 보낼 수 있습니다)',
                },
                {
                  title: '3. chat_id 확인',
                  body: 'https://api.telegram.org/bot<봇토큰>/getUpdates 를 브라우저에서 열면 result → message → chat → id 값이 chat_id 입니다.',
                },
                {
                  title: '4. 저장 후 테스트',
                  body: '아래에 봇 토큰과 chat_id를 저장하고 "테스트 발송"으로 확인하세요. 이후 예약금 입금 대기 발생·입금 확인 시 알림이 옵니다.',
                },
              ]}
            />
            <TelegramSettings
              initialBotToken={deposit.telegramBotToken}
              initialChatId={deposit.telegramChatId}
            />
          </>
        }
        kakaoPanel={
          <>
            <Guide
              title="카카오 디벨로퍼스 연동 방법"
              steps={[
                {
                  title: '1. 카카오 디벨로퍼스 앱 생성',
                  body: (
                    <>
                      <a
                        href="https://developers.kakao.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary font-semibold hover:underline"
                      >
                        developers.kakao.com
                      </a>
                      에 로그인 후 [내 애플리케이션] → [애플리케이션 추가하기]로 앱을 만듭니다.
                    </>
                  ),
                },
                {
                  title: '2. REST API 키 확인',
                  body: '[앱 설정 > 요약 정보]의 "REST API 키"를 아래 입력창에 붙여넣습니다.',
                },
                {
                  title: '3. 카카오 로그인 활성화 + Redirect URI 등록',
                  body: '[제품 설정 > 카카오 로그인]에서 활성화하고, 아래에 표시된 Redirect URI를 그대로 등록합니다.',
                },
                {
                  title: '4. 동의항목에서 "카카오톡 메시지 전송" 활성화',
                  body: '[제품 설정 > 카카오 로그인 > 동의항목]에서 해당 항목을 사용 설정으로 켭니다. (개발 중인 앱에 등록된 본인 계정은 검수 없이 사용 가능)',
                },
                {
                  title: '5. (해당 시) Client Secret',
                  body: '[보안]에서 "Client Secret 사용함"이 켜져 있다면 발급된 코드를 아래에 함께 저장해야 합니다. 켜져 있는데 비워두면 "Bad client credentials" 오류가 납니다.',
                },
                {
                  title: '6. 저장 후 계정 연동',
                  body: '저장한 뒤 "카카오 계정 연동하기"를 눌러 완료합니다. 이후 예약 접수 시 관리자 본인 카카오톡("나에게 보내기")으로 알림이 옵니다.',
                },
              ]}
            />
            <KakaoNotifySettings
              initialRestApiKey={kakao.restApiKey}
              initialClientSecret={kakao.clientSecret}
              initialRedirectUri={kakao.redirectUri}
              connected={kakao.connected}
              connectedNotice={params.kakao_connected ? '카카오 계정 연동이 완료되었습니다.' : ''}
              errorNotice={params.kakao_error ?? ''}
            />
          </>
        }
        aligoPanel={
          <>
            <Guide
              title="알리고 연동 방법 (고객 발송 · 건당 과금)"
              steps={[
                {
                  title: '1. 알리고 가입 및 API 키 발급',
                  body: (
                    <>
                      <a
                        href="https://smartsms.aligo.in"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary font-semibold hover:underline"
                      >
                        smartsms.aligo.in
                      </a>
                      에서 가입 후 [마이페이지 &gt; API 키 발급]에서 API 키와 아이디를 확인합니다.
                    </>
                  ),
                },
                {
                  title: '2. 발신번호 등록',
                  body: '[마이페이지 > 발신번호 관리]에서 사업자 명의 번호를 등록합니다. 문자 대체발송에도 이 번호가 쓰입니다.',
                },
                {
                  title: '3. 카카오톡 채널 연동 (발신프로필 키)',
                  body: '[카카오 알림톡 > 발신프로필 등록]에서 채널을 연동하면 senderkey가 발급됩니다.',
                },
                {
                  title: '4. 템플릿 등록 및 심사',
                  body: '아래 "알림톡 문구"를 그대로 복사해 템플릿으로 등록하고 심사를 신청하세요. 보통 1~3영업일 걸리며, 완료되면 tpl_code가 발급됩니다.',
                },
                {
                  title: '5. 저장 후 테스트 발송',
                  body: '모든 값을 저장하고 "테스트 발송"으로 본인 휴대폰 도착을 확인하세요.',
                },
              ]}
            />
            <AligoNotifySettings
              initialApiKey={aligo.apiKey}
              initialUserId={aligo.userId}
              initialSender={aligo.sender}
              initialSenderKey={aligo.senderKey}
              initialTplCode={aligo.tplCode}
              initialMessageTemplate={aligo.messageTemplate}
              initialUseSmsFallback={aligo.useSmsFallback}
              configured={aligo.configured}
            />
          </>
        }
      />
    </div>
  );
}
