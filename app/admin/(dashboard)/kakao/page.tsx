import { requirePagePermission } from '@/lib/admin/auth';
import { getKakaoConfig } from '@/lib/kakao';
import KakaoNotifySettings from '../KakaoNotifySettings';

export const dynamic = 'force-dynamic';

export default async function KakaoAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ kakao_connected?: string; kakao_error?: string }>;
}) {
  await requirePagePermission('kakao');
  const config = await getKakaoConfig();
  const params = await searchParams;

  const steps = [
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
          에 카카오 계정으로 로그인 후 [내 애플리케이션] → [애플리케이션 추가하기]로 앱을 하나
          만듭니다. (예: &quot;송도캠핑장 알림&quot;)
        </>
      ),
    },
    {
      title: '2. REST API 키 확인',
      body: '생성한 앱의 [앱 설정 > 요약 정보]에 있는 "REST API 키"를 복사해 아래 입력창에 붙여넣습니다.',
    },
    {
      title: '3. 카카오 로그인 활성화 + Redirect URI 등록',
      body: (
        <>
          [제품 설정 &gt; 카카오 로그인]에서 활성화 설정을 켜고, Redirect URI에 아래 주소를 그대로
          등록합니다.
        </>
      ),
    },
    {
      title: '4. 동의항목에서 "카카오톡 메시지 전송" 활성화',
      body: '[제품 설정 > 카카오 로그인 > 동의항목]에서 "카카오톡 메시지 전송" 항목을 찾아 사용 설정으로 켭니다. (개발 중인 앱에 등록된 본인 계정으로는 별도 검수 없이 바로 사용 가능합니다)',
    },
    {
      title: '5. (해당 시) Client Secret 발급',
      body: '[제품 설정 > 카카오 로그인 > 보안]에서 "Client Secret 사용함"이 켜져 있다면, 아래 Client Secret 입력창에 발급된 코드를 함께 저장해야 합니다. 켜져 있지 않다면 이 단계는 건너뛰어도 됩니다. (이 설정을 켜두고 Client Secret 없이 연동하면 "Bad client credentials" 오류가 발생합니다)',
    },
    {
      title: '6. 저장 후 계정 연동',
      body: '아래에 REST API 키와 Redirect URI를 저장한 뒤 "카카오 계정 연동하기" 버튼을 눌러 카카오 로그인으로 연동을 완료합니다. 이후 케노피 예약이 접수될 때마다 관리자 본인의 카카오톡("나에게 보내기")으로 알림이 도착합니다.',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">카카오톡 알림 설정</h1>
        <p className="text-gray-500">
          케노피 예약이 접수되면 이메일 대신 관리자 본인의 카카오톡으로 알림을 받을 수 있습니다.
          카카오 디벨로퍼스에서 발급받은 키를 연동해야 사용할 수 있습니다.
        </p>
      </div>

      <section className="bg-white rounded-xl shadow p-6">
        <h2 className="font-bold text-gray-900 mb-4">카카오 디벨로퍼스 연동 방법</h2>
        <ol className="space-y-4">
          {steps.map((step) => (
            <li key={step.title} className="text-sm">
              <p className="font-semibold text-gray-800 mb-1">{step.title}</p>
              <p className="text-gray-600 leading-relaxed">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <KakaoNotifySettings
        initialRestApiKey={config.restApiKey}
        initialClientSecret={config.clientSecret}
        initialRedirectUri={config.redirectUri}
        connected={config.connected}
        connectedNotice={params.kakao_connected ? '카카오 계정 연동이 완료되었습니다.' : ''}
        errorNotice={params.kakao_error ?? ''}
      />
    </div>
  );
}
