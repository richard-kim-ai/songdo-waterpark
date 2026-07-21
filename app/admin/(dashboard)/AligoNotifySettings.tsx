'use client';

import { useState, useTransition } from 'react';
import { saveAligoSettings, sendAligoTestMessageAction } from '@/app/admin/actions';

export default function AligoNotifySettings({
  initialApiKey,
  initialUserId,
  initialSender,
  initialSenderKey,
  initialTplCode,
  initialMessageTemplate,
  initialUseSmsFallback,
  configured,
}: {
  initialApiKey: string;
  initialUserId: string;
  initialSender: string;
  initialSenderKey: string;
  initialTplCode: string;
  initialMessageTemplate: string;
  initialUseSmsFallback: boolean;
  configured: boolean;
}) {
  const [apiKey, setApiKey] = useState(initialApiKey);
  const [userId, setUserId] = useState(initialUserId);
  const [sender, setSender] = useState(initialSender);
  const [senderKey, setSenderKey] = useState(initialSenderKey);
  const [tplCode, setTplCode] = useState(initialTplCode);
  const [messageTemplate, setMessageTemplate] = useState(initialMessageTemplate);
  const [useSmsFallback, setUseSmsFallback] = useState(initialUseSmsFallback);
  const [saved, setSaved] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const [testPending, startTestTransition] = useTransition();

  function handleSave() {
    setSaved(false);
    startTransition(async () => {
      await saveAligoSettings({
        apiKey,
        userId,
        sender,
        senderKey,
        tplCode,
        messageTemplate,
        useSmsFallback,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  function handleTestMessage() {
    setTestResult(null);
    if (!testPhone.trim()) {
      setTestResult({ ok: false, message: '테스트로 받아볼 휴대폰 번호를 입력해주세요.' });
      return;
    }
    startTestTransition(async () => {
      const res = await sendAligoTestMessageAction(testPhone);
      setTestResult(
        res.ok
          ? { ok: true, message: '테스트 메시지를 보냈습니다. 실제 요금이 발생할 수 있습니다.' }
          : { ok: false, message: res.error }
      );
    });
  }

  return (
    <section className="bg-white rounded-xl shadow p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-gray-900">연동 설정</h2>
        {configured ? (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary">
            <i className="ri-checkbox-circle-fill"></i> 연동됨
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">
            연동 안됨
          </span>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">API 키</label>
          <input
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="알리고 마이페이지의 API 키"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">알리고 아이디</label>
          <input
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="알리고 로그인 아이디"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">발신번호</label>
          <input
            value={sender}
            onChange={(e) => setSender(e.target.value)}
            placeholder="알리고에 등록한 발신번호"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            발신프로필 키 (senderkey)
          </label>
          <input
            value={senderKey}
            onChange={(e) => setSenderKey(e.target.value)}
            placeholder="카카오톡 채널 연동 후 발급된 키"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            템플릿 코드 (tpl_code)
          </label>
          <input
            value={tplCode}
            onChange={(e) => setTplCode(e.target.value)}
            placeholder="템플릿 심사 완료 후 발급된 코드"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">
          알림톡 문구 (템플릿) — 아래 문구를 그대로 복사해 알리고 템플릿 등록 화면에 심사
          신청하세요. 문구가 다르면 발송이 실패합니다.
        </label>
        <textarea
          value={messageTemplate}
          onChange={(e) => setMessageTemplate(e.target.value)}
          rows={7}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
        <input
          type="checkbox"
          checked={useSmsFallback}
          onChange={(e) => setUseSmsFallback(e.target.checked)}
        />
        알림톡 발송 실패 시 문자(SMS)로 자동 대체발송 (요금이 추가로 발생할 수 있습니다)
      </label>

      {saved && <p className="text-sm text-green-600 font-semibold">저장됨</p>}

      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleSave}
          disabled={pending}
          className="px-5 py-2 bg-gray-900 text-white text-sm font-semibold !rounded-button hover:bg-opacity-90 transition-all disabled:opacity-50 cursor-pointer"
        >
          저장하기
        </button>
      </div>

      <div className="border-t pt-4">
        <label className="block text-xs font-semibold text-gray-600 mb-1">
          테스트 발송 (본인 휴대폰 번호)
        </label>
        <div className="flex flex-wrap gap-2">
          <input
            value={testPhone}
            onChange={(e) => setTestPhone(e.target.value)}
            placeholder="010-0000-0000"
            className="flex-1 min-w-[200px] px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            onClick={handleTestMessage}
            disabled={testPending}
            className="px-5 py-2 bg-primary text-white text-sm font-semibold !rounded-button hover:bg-opacity-90 transition-all disabled:opacity-50 cursor-pointer"
          >
            {testPending ? '발송 중...' : '테스트 발송'}
          </button>
        </div>
        {testResult && (
          <p
            className={`text-sm font-semibold mt-2 ${testResult.ok ? 'text-green-600' : 'text-red-600'}`}
          >
            {testResult.message}
          </p>
        )}
      </div>
    </section>
  );
}
