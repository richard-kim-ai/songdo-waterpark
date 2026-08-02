'use client';

import { useState, useTransition } from 'react';
import {
  saveDepositPolicy,
  updateDepositSettings,
  testTelegram,
  getPendingDeposits,
  confirmDeposit,
  releaseUnpaidDeposit,
  syncDepositsFromBank,
  type PendingDeposit,
} from '@/app/admin/deposit-actions';
import type { DepositSettings } from '@/lib/telegram';

type Policy = {
  enabled: boolean;
  amount: number;
  bankName: string;
  accountNo: string;
  holder: string;
  guide: string;
};

const won = (n: number) => `${n.toLocaleString('ko-KR')}원`;

function Card({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl shadow p-4 md:p-6 mb-6">
      <h2 className="font-bold text-gray-900 mb-1">{title}</h2>
      {desc && <p className="text-xs text-gray-500 mb-4 leading-relaxed">{desc}</p>}
      {children}
    </div>
  );
}

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

const inputClass =
  'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary';

export default function DepositManager({
  initialPolicy,
  initialSettings,
  initialPending,
}: {
  initialPolicy: Policy;
  initialSettings: DepositSettings;
  initialPending: PendingDeposit[];
}) {
  const [policy, setPolicy] = useState(initialPolicy);
  const [settings, setSettings] = useState(initialSettings);
  const [pending, setPending] = useState(initialPending);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, startTransition] = useTransition();

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

  const reloadPending = async () => setPending(await getPendingDeposits());

  return (
    <div>
      {(message || error) && (
        <p
          className={`mb-4 text-sm font-semibold ${error ? 'text-red-600' : 'text-primary'}`}
        >
          {error || message}
        </p>
      )}

      <Card
        title="입금 대기 예약"
        desc="고객이 자리를 지정해 예약한 건입니다. 입금이 확인되면 '입금 확인'을 눌러 예약을 확정하세요. 입금이 오지 않으면 '자리 반환'으로 예약을 취소해 다른 고객이 예약할 수 있게 합니다."
      >
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() =>
              run(async () => {
                const res = await syncDepositsFromBank();
                if (!res.ok) {
                  setError(res.error);
                  return;
                }
                await reloadPending();
                setMessage(
                  res.matched.length > 0
                    ? `입금 ${res.matched.length}건 자동 확인: ${res.matched.join(', ')}`
                    : `조회된 입금 ${res.checked}건 중 매칭되는 예약이 없습니다.`
                );
              })
            }
            disabled={busy}
            className="flex items-center gap-1 px-4 py-2 bg-slate-800 text-white text-sm font-semibold !rounded-button hover:bg-opacity-90 transition-all disabled:opacity-50 cursor-pointer"
          >
            <i className="ri-refresh-line"></i> 입금내역 자동조회
          </button>
          <button
            onClick={() => run(reloadPending)}
            disabled={busy}
            className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-semibold !rounded-button hover:bg-gray-50 transition-all disabled:opacity-50 cursor-pointer"
          >
            목록 새로고침
          </button>
        </div>

        {pending.length === 0 ? (
          <p className="text-sm text-gray-400 bg-gray-50 rounded-lg px-4 py-6 text-center">
            입금 대기 중인 예약이 없습니다.
          </p>
        ) : (
          <div className="space-y-2">
            {pending.map((p) => (
              <div
                key={p.id}
                className="flex flex-wrap items-center gap-x-2 gap-y-1 bg-amber-50 rounded-lg px-3 py-2.5"
              >
                <span className="order-1 font-semibold text-sm text-gray-800 md:w-40 md:shrink-0">
                  {p.reservationDate} · {p.zoneLabel} {p.timeType} {p.cabanaNo}번
                </span>
                <span className="order-4 md:order-2 w-full md:w-auto md:flex-1 md:min-w-0 text-xs md:text-sm text-gray-600">
                  {p.name} ({p.phone}) · 입금자명 <strong>{p.depositorName}</strong> ·{' '}
                  {won(p.depositAmount)}
                </span>
                <span className="order-2 md:order-3 flex gap-1 shrink-0">
                  <button
                    onClick={() =>
                      run(async () => {
                        await confirmDeposit(p.id);
                        await reloadPending();
                        setMessage(`${p.name}님 입금을 확인해 예약을 확정했습니다.`);
                      })
                    }
                    disabled={busy}
                    className="px-3 py-1.5 bg-primary text-white text-xs font-semibold !rounded-button hover:bg-opacity-90 disabled:opacity-50 cursor-pointer"
                  >
                    입금 확인
                  </button>
                  <button
                    onClick={() => {
                      if (!confirm(`${p.name}님 예약(${p.reservationNo})을 취소하고 자리를 반환할까요?`))
                        return;
                      run(async () => {
                        await releaseUnpaidDeposit(p.id);
                        await reloadPending();
                        setMessage('예약을 취소하고 자리를 반환했습니다.');
                      });
                    }}
                    disabled={busy}
                    className="px-3 py-1.5 border border-red-300 text-red-600 text-xs font-semibold !rounded-button hover:bg-red-50 disabled:opacity-50 cursor-pointer"
                  >
                    자리 반환
                  </button>
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card
        title="예약금 정책"
        desc="예약금을 사용하면 고객이 배치도에서 자리를 지정할 때 아래 계좌가 안내되고, 예약은 '입금 대기' 상태로 접수됩니다. 자리를 지정하지 않고 자동 배정으로 예약하면 예약금 없이 기존과 동일하게 처리됩니다."
      >
        <label className="flex items-center gap-2 mb-4 cursor-pointer">
          <input
            type="checkbox"
            checked={policy.enabled}
            onChange={(e) => setPolicy({ ...policy, enabled: e.target.checked })}
            className="w-4 h-4 cursor-pointer"
          />
          <span className="text-sm font-semibold text-gray-800">자리 지정 예약에 예약금 받기</span>
        </label>

        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="예약금 (원)">
            <input
              type="number"
              min={0}
              step={1000}
              value={policy.amount}
              onChange={(e) => setPolicy({ ...policy, amount: Number(e.target.value) || 0 })}
              className={inputClass}
            />
          </Field>
          <Field label="입금 은행">
            <input
              value={policy.bankName}
              onChange={(e) => setPolicy({ ...policy, bankName: e.target.value })}
              placeholder="예) 토스뱅크"
              className={inputClass}
            />
          </Field>
          <Field label="계좌번호">
            <input
              value={policy.accountNo}
              onChange={(e) => setPolicy({ ...policy, accountNo: e.target.value })}
              placeholder="예) 1000-0000-0000"
              className={inputClass}
            />
          </Field>
          <Field label="예금주">
            <input
              value={policy.holder}
              onChange={(e) => setPolicy({ ...policy, holder: e.target.value })}
              placeholder="예) 송도국제캠핑장"
              className={inputClass}
            />
          </Field>
        </div>

        <div className="mt-3">
          <Field
            label="예약금 안내 문구"
            hint="예약 완료 화면에 계좌와 함께 표시됩니다. 입금 기한 등을 적어주세요."
          >
            <textarea
              rows={3}
              value={policy.guide}
              onChange={(e) => setPolicy({ ...policy, guide: e.target.value })}
              placeholder="예) 예약 후 24시간 안에 입금해주세요. 미입금 시 자리가 자동 취소됩니다."
              className={inputClass}
            />
          </Field>
        </div>

        <button
          onClick={() =>
            run(async () => {
              await saveDepositPolicy(policy);
              setMessage('예약금 정책을 저장했습니다.');
            })
          }
          disabled={busy}
          className="mt-4 px-6 py-2 bg-primary text-white font-semibold !rounded-button hover:bg-opacity-90 transition-all disabled:opacity-50 cursor-pointer"
        >
          저장하기
        </button>
      </Card>

      <Card
        title="텔레그램 알림 (무료)"
        desc="@BotFather에서 봇을 만들면 봇 토큰이 발급됩니다. 그 봇과 대화를 시작한 뒤 https://api.telegram.org/bot<토큰>/getUpdates 를 열면 chat_id를 확인할 수 있습니다. 입금 대기 발생·입금 확인 시 알림이 옵니다."
      >
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="봇 토큰">
            <input
              value={settings.telegramBotToken}
              onChange={(e) => setSettings({ ...settings, telegramBotToken: e.target.value })}
              placeholder="123456789:AA..."
              className={inputClass}
            />
          </Field>
          <Field label="chat_id">
            <input
              value={settings.telegramChatId}
              onChange={(e) => setSettings({ ...settings, telegramChatId: e.target.value })}
              placeholder="예) 123456789"
              className={inputClass}
            />
          </Field>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          <button
            onClick={() =>
              run(async () => {
                await updateDepositSettings({
                  telegramBotToken: settings.telegramBotToken,
                  telegramChatId: settings.telegramChatId,
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
      </Card>

      <Card
        title="오픈뱅킹 자동 입금확인 (선택)"
        desc="금융결제원 오픈뱅킹 이용기관으로 등록해 access_token(scope=inquiry)과 핀테크이용번호를 발급받으면, '입금내역 자동조회'로 입금자명·금액을 맞춰 자동 확정할 수 있습니다. 발급 전에는 비워두고 수동 확인으로 운영하세요. 토스뱅크 계좌도 오픈뱅킹으로 조회됩니다."
      >
        <label className="flex items-center gap-2 mb-4 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.openbankingEnabled}
            onChange={(e) => setSettings({ ...settings, openbankingEnabled: e.target.checked })}
            className="w-4 h-4 cursor-pointer"
          />
          <span className="text-sm font-semibold text-gray-800">오픈뱅킹 자동조회 사용</span>
        </label>
        <div className="space-y-3">
          <Field label="access_token">
            <input
              value={settings.openbankingAccessToken}
              onChange={(e) =>
                setSettings({ ...settings, openbankingAccessToken: e.target.value })
              }
              className={inputClass}
            />
          </Field>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="핀테크이용번호 (fintech_use_num)">
              <input
                value={settings.openbankingFintechUseNum}
                onChange={(e) =>
                  setSettings({ ...settings, openbankingFintechUseNum: e.target.value })
                }
                className={inputClass}
              />
            </Field>
            <Field label="이용기관코드 (9자리)" hint="은행거래고유번호 생성에 사용됩니다.">
              <input
                value={settings.openbankingClientUseCode}
                onChange={(e) =>
                  setSettings({ ...settings, openbankingClientUseCode: e.target.value })
                }
                className={inputClass}
              />
            </Field>
          </div>
        </div>
        <button
          onClick={() =>
            run(async () => {
              await updateDepositSettings({
                openbankingAccessToken: settings.openbankingAccessToken,
                openbankingFintechUseNum: settings.openbankingFintechUseNum,
                openbankingClientUseCode: settings.openbankingClientUseCode,
                openbankingEnabled: settings.openbankingEnabled,
              });
              setMessage('오픈뱅킹 설정을 저장했습니다.');
            })
          }
          disabled={busy}
          className="mt-4 px-6 py-2 bg-primary text-white font-semibold !rounded-button hover:bg-opacity-90 transition-all disabled:opacity-50 cursor-pointer"
        >
          저장하기
        </button>
      </Card>
    </div>
  );
}
