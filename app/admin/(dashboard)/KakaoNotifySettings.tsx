'use client';

import { useEffect, useState, useTransition } from 'react';
import {
  saveKakaoSettings,
  disconnectKakaoAction,
  sendKakaoTestMessageAction,
} from '@/app/admin/actions';

function buildAuthorizeUrl(restApiKey: string, redirectUri: string) {
  const params = new URLSearchParams({
    client_id: restApiKey,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'talk_message',
  });
  return `https://kauth.kakao.com/oauth/authorize?${params.toString()}`;
}

export default function KakaoNotifySettings({
  initialRestApiKey,
  initialClientSecret,
  initialRedirectUri,
  connected,
  connectedNotice,
  errorNotice,
}: {
  initialRestApiKey: string;
  initialClientSecret: string;
  initialRedirectUri: string;
  connected: boolean;
  connectedNotice: string;
  errorNotice: string;
}) {
  const [restApiKey, setRestApiKey] = useState(initialRestApiKey);
  const [clientSecret, setClientSecret] = useState(initialClientSecret);
  const [redirectUri, setRedirectUri] = useState(initialRedirectUri);
  const [saved, setSaved] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const [testPending, startTestTransition] = useTransition();
  const [disconnectPending, startDisconnectTransition] = useTransition();

  useEffect(() => {
    if (!initialRedirectUri && typeof window !== 'undefined') {
      setRedirectUri(`${window.location.origin}/admin/kakao/callback`);
    }
  }, [initialRedirectUri]);

  function handleSave() {
    setSaved(false);
    startTransition(async () => {
      await saveKakaoSettings(restApiKey, clientSecret, redirectUri);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  function handleConnect() {
    startTransition(async () => {
      await saveKakaoSettings(restApiKey, clientSecret, redirectUri);
      window.location.href = buildAuthorizeUrl(restApiKey.trim(), redirectUri.trim());
    });
  }

  function handleDisconnect() {
    if (!confirm('카카오 계정 연동을 해제할까요?')) return;
    startDisconnectTransition(async () => {
      await disconnectKakaoAction();
      setTestResult(null);
    });
  }

  function handleTestMessage() {
    setTestResult(null);
    startTestTransition(async () => {
      const res = await sendKakaoTestMessageAction();
      setTestResult(
        res.ok
          ? { ok: true, message: '테스트 메시지를 보냈습니다. 카카오톡을 확인해보세요.' }
          : { ok: false, message: res.error }
      );
    });
  }

  return (
    <section className="bg-white rounded-xl shadow p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-gray-900">연동 설정</h2>
        {connected ? (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary">
            <i className="ri-checkbox-circle-fill"></i> 연동됨
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">
            연동 안됨
          </span>
        )}
      </div>

      {connectedNotice && (
        <p className="text-sm text-primary font-semibold bg-primary/5 rounded-lg px-4 py-2">
          {connectedNotice}
        </p>
      )}
      {errorNotice && (
        <p className="text-sm text-red-600 font-semibold bg-red-50 rounded-lg px-4 py-2">
          {errorNotice}
        </p>
      )}

      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">REST API 키</label>
        <input
          value={restApiKey}
          onChange={(e) => setRestApiKey(e.target.value)}
          placeholder="카카오 디벨로퍼스 앱의 REST API 키"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">
          Client Secret (선택 — 앱의 [보안] 설정에서 &quot;Client Secret 사용함&quot;을 켠
          경우에만 필요)
        </label>
        <input
          value={clientSecret}
          onChange={(e) => setClientSecret(e.target.value)}
          placeholder="Client Secret 사용 시에만 입력"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">
          Redirect URI (카카오 디벨로퍼스에 동일하게 등록)
        </label>
        <input
          value={redirectUri}
          onChange={(e) => setRedirectUri(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {saved && <p className="text-sm text-green-600 font-semibold">저장됨</p>}

      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleSave}
          disabled={pending}
          className="px-5 py-2 bg-gray-900 text-white text-sm font-semibold !rounded-button hover:bg-opacity-90 transition-all disabled:opacity-50 cursor-pointer"
        >
          저장하기
        </button>
        <button
          onClick={handleConnect}
          disabled={pending || !restApiKey.trim() || !redirectUri.trim()}
          className="px-5 py-2 bg-[#FEE500] text-[#191919] text-sm font-semibold !rounded-button hover:bg-opacity-90 transition-all disabled:opacity-50 cursor-pointer"
        >
          <i className="ri-kakao-talk-fill mr-1"></i>
          {connected ? '카카오 계정 다시 연동하기' : '카카오 계정 연동하기'}
        </button>
        {connected && (
          <>
            <button
              onClick={handleTestMessage}
              disabled={testPending}
              className="px-5 py-2 bg-primary text-white text-sm font-semibold !rounded-button hover:bg-opacity-90 transition-all disabled:opacity-50 cursor-pointer"
            >
              {testPending ? '발송 중...' : '테스트 메시지 보내기'}
            </button>
            <button
              onClick={handleDisconnect}
              disabled={disconnectPending}
              className="px-5 py-2 bg-red-50 text-red-600 text-sm font-semibold !rounded-button hover:bg-red-100 transition-all disabled:opacity-50 cursor-pointer"
            >
              연동 해제
            </button>
          </>
        )}
      </div>

      {testResult && (
        <p
          className={`text-sm font-semibold ${testResult.ok ? 'text-green-600' : 'text-red-600'}`}
        >
          {testResult.message}
        </p>
      )}
    </section>
  );
}
