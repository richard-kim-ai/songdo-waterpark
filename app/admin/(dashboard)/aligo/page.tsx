import { requirePagePermission } from '@/lib/admin/auth';
import { getAligoConfig } from '@/lib/aligo';
import AligoNotifySettings from '../AligoNotifySettings';

export const dynamic = 'force-dynamic';

export default async function AligoAdminPage() {
  await requirePagePermission('aligo');
  const config = await getAligoConfig();

  const steps = [
    {
      title: '1. 알리고(Aligo) 가입 및 API 키 발급',
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
          에서 회원가입 후 [마이페이지 &gt; API 키 발급]에서 API 키와 아이디를 확인합니다.
        </>
      ),
    },
    {
      title: '2. 발신번호 등록',
      body: '[마이페이지 > 발신번호 관리]에서 문자를 보낼 발신번호(사업자 명의 휴대폰/유선번호)를 등록합니다. 대체발송(SMS) 시에도 이 번호가 사용됩니다.',
    },
    {
      title: '3. 카카오톡 채널 연동 (발신프로필 키 발급)',
      body: '[카카오 알림톡 > 발신프로필 등록]에서 이미 만들어 둔 카카오톡 채널을 연동하면 "발신프로필 키(senderkey)"가 발급됩니다.',
    },
    {
      title: '4. 알림톡 템플릿 등록 및 심사 신청',
      body: (
        <>
          [카카오 알림톡 &gt; 템플릿 관리]에서 새 템플릿을 등록합니다. 아래 &quot;알림톡 문구
          (템플릿)&quot;에 있는 문구를 그대로 복사해 등록하고 심사를 신청하세요. 심사에는 보통
          1~3영업일이 걸리며, 심사가 완료되면 템플릿 코드(tpl_code)가 발급됩니다.
        </>
      ),
    },
    {
      title: '5. 저장 후 테스트 발송',
      body: '심사 완료 후 API 키/아이디/발신번호/발신프로필 키/템플릿 코드를 모두 저장하고, "테스트 발송"으로 본인 휴대폰에 정상적으로 도착하는지 확인하세요. 이후 케노피 예약이 접수될 때마다 예약자 본인 휴대폰으로 자동 발송됩니다.',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">고객 알림톡 설정</h1>
        <p className="text-gray-500">
          케노피 예약이 접수되면 예약자 본인의 휴대폰으로 카카오 알림톡(실패 시 문자 자동
          대체발송)을 보낼 수 있습니다. 알리고(Aligo) 연동이 필요합니다.
        </p>
      </div>

      <section className="bg-white rounded-xl shadow p-6">
        <h2 className="font-bold text-gray-900 mb-4">알리고 연동 방법</h2>
        <ol className="space-y-4">
          {steps.map((step) => (
            <li key={step.title} className="text-sm">
              <p className="font-semibold text-gray-800 mb-1">{step.title}</p>
              <p className="text-gray-600 leading-relaxed">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <AligoNotifySettings
        initialApiKey={config.apiKey}
        initialUserId={config.userId}
        initialSender={config.sender}
        initialSenderKey={config.senderKey}
        initialTplCode={config.tplCode}
        initialMessageTemplate={config.messageTemplate}
        initialUseSmsFallback={config.useSmsFallback}
        configured={config.configured}
      />
    </div>
  );
}
