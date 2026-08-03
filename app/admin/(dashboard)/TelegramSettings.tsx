'use client';

import { useState, useTransition } from 'react';
import { updateDepositSettings, testTelegram } from '@/app/admin/deposit-actions';

const inputClass =
  'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary';

export default function TelegramSettings({
  initialBotToken,
  initialChatId,
}: {
  initialBotToken: string;
  initialChatId: string;
}) {
  const [botToken, setBotToken] = useState(initialBotToken);
  const [chatId, setChatId] = useState(initialChatId);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, startTransition] = useTransition();

  const connected = !!(initialBotToken && initialChatId);

  function run(fn: () => Promise<void>) {
    setMessage('');
    setError('');
    startTransition(async () => {
      try {
        await fn();
      } catch (err) {
        setError(err instanceof Error ? err.message : '처리 중 오류가 발생했습니다.');
      }
    });
  }

  return (
    <section className="bg-white rounded-xl shadow p-4 md:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-gray-900">연동 설정</h2>
        <span
          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
            connected ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-500'
          }`}
        >
          {connected ? '연동됨' : '연동 안됨'}
        </span>
      </div>

      {(message || error) && (
        <p className={`text-sm font-semibold ${error ? 'text-red-600' : 'text-primary'}`}>
          {error || message}
        </p>
      )}

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">봇 토큰</label>
          <input
            value={botToken}
            onChange={(e) => setBotToken(e.target.value)}
            placeholder="123456789:AA..."
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">chat_id</label>
          <input
            value={chatId}
            onChange={(e) => setChatId(e.target.value)}
            placeholder="예) 123456789"
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() =>
            run(async () => {
              await updateDepositSettings({
                telegramBotToken: botToken,
                telegramChatId: chatId,
              });
              setMessage('텔레그램 설정을 저장했습니다.');
            })
          }
          disabled={busy}
          className="px-6 py-2 bg-primary text-white font-semibold !rounded-button hover:bg-opacity-90 transition-all disabled:opacity-50 cursor-pointer"
        >
          저장하기
        </button>
        <button
          onClick={() =>
            run(async () => {
              const res = await testTelegram();
              if (res.ok) setMessage('테스트 메시지를 발송했습니다. 텔레그램을 확인해주세요.');
              else setError(res.error);
            })
          }
          disabled={busy}
          className="px-6 py-2 border border-gray-300 text-gray-700 font-semibold !rounded-button hover:bg-gray-50 transition-all disabled:opacity-50 cursor-pointer"
        >
          테스트 발송
        </button>
      </div>
    </section>
  );
}
