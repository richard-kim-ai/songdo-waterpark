'use client';

import { useEffect, useState, useTransition } from 'react';
import { getCabanaAvailability, createCabanaReservation } from '@/app/cabana-reservation/actions';

type TimeType = '주간' | '야간' | '종일';

function today() {
  return new Date().toISOString().slice(0, 10);
}

function formatDateKorean(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return `${y}년 ${m}월 ${d}일`;
}

function formatPhoneNumber(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length < 4) return digits;
  if (digits.length < 8) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  if (digits.length === 10) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

export default function CabanaReservationModal({ buttonLabel }: { buttonLabel: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full mt-6 px-6 py-4 bg-primary text-white font-bold text-lg !rounded-button hover:bg-opacity-90 transition-all whitespace-nowrap cursor-pointer"
      >
        {buttonLabel}
      </button>
      {open && <ReservationModal onClose={() => setOpen(false)} />}
    </>
  );
}

function ReservationModal({ onClose }: { onClose: () => void }) {
  const [date, setDate] = useState(today());
  const [timeType, setTimeType] = useState<TimeType>('주간');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [guestCount, setGuestCount] = useState(1);
  const [isCamping, setIsCamping] = useState(false);
  const [hasAdmission, setHasAdmission] = useState(false);
  const [availability, setAvailability] = useState({ dayLeft: 0, nightLeft: 0, fullDayLeft: 0 });
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ reservationNo: string; cabanaNo: number } | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let active = true;
    getCabanaAvailability(date).then((res) => {
      if (active) setAvailability(res);
    });
    return () => {
      active = false;
    };
  }, [date]);

  function handleSubmit() {
    setError('');
    if (!name.trim() || !phone.trim()) {
      setError('예약자 성함과 연락처를 입력해주세요.');
      return;
    }
    startTransition(async () => {
      const fd = new FormData();
      fd.set('reservationDate', date);
      fd.set('timeType', timeType);
      fd.set('name', name.trim());
      fd.set('phone', phone.trim());
      fd.set('guestCount', String(guestCount));
      fd.set('isCamping', String(isCamping));
      fd.set('hasAdmission', String(hasAdmission));

      const res = await createCabanaReservation(fd);
      if (res.ok) {
        setResult({ reservationNo: res.reservationNo, cabanaNo: res.cabanaNo });
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
          <h3 className="font-bold text-lg text-gray-900">케노피 실시간 예약</h3>
          <button onClick={onClose} aria-label="닫기" className="cursor-pointer">
            <i className="ri-close-line text-2xl text-gray-500"></i>
          </button>
        </div>

        {result ? (
          <div className="p-6 space-y-4">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <p className="text-gray-700">예약이 완료되었습니다!</p>
              <p className="text-2xl font-bold text-primary mt-2">
                {name} · {timeType} 이용권
              </p>
              <p className="text-sm text-gray-600 mt-1">예약순번 {result.cabanaNo}번</p>
              <p className="text-sm text-gray-500 mt-1">{formatDateKorean(date)}</p>
              <p className="text-sm text-gray-500 mt-1">예약번호 {result.reservationNo}</p>
            </div>
            <p className="text-xs text-gray-500 text-center">
              예약번호를 가지고 현장에서 결제 시 케노피 위치는 선착순으로 배정됩니다.
            </p>
            <button
              onClick={onClose}
              className="w-full px-6 py-3 bg-primary text-white font-semibold !rounded-button hover:bg-opacity-90 transition-all cursor-pointer"
            >
              확인
            </button>
          </div>
        ) : (
          <>
            <div className="p-6 space-y-3 overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">예약 일자</label>
                <input
                  type="date"
                  value={date}
                  min={today()}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-3 gap-2 bg-blue-50 rounded-lg p-3 text-center text-sm">
                <div>
                  <p className="text-gray-500">주간 잔여</p>
                  <p className="font-bold text-gray-900">{availability.dayLeft}개</p>
                </div>
                <div>
                  <p className="text-gray-500">야간 잔여</p>
                  <p className="font-bold text-gray-900">{availability.nightLeft}개</p>
                </div>
                <div>
                  <p className="text-gray-500">종일 잔여</p>
                  <p className="font-bold text-gray-900">{availability.fullDayLeft}개</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">이용권 종류</label>
                <select
                  value={timeType}
                  onChange={(e) => setTimeType(e.target.value as TimeType)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="주간" disabled={availability.dayLeft <= 0}>
                    주간 타임 (잔여 {availability.dayLeft}개)
                  </option>
                  <option value="야간" disabled={availability.nightLeft <= 0}>
                    야간 타임 (잔여 {availability.nightLeft}개)
                  </option>
                  <option value="종일" disabled={availability.fullDayLeft <= 0}>
                    종일 패키지 (잔여 {availability.fullDayLeft}개)
                  </option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">예약자 성함</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={50}
                    placeholder="홍길동"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">연락처</label>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
                    type="tel"
                    maxLength={13}
                    placeholder="010-0000-0000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">이용 인원수</label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={guestCount}
                  onChange={(e) => setGuestCount(Number(e.target.value) || 1)}
                  className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex flex-col gap-2 text-sm text-gray-700">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isCamping}
                    onChange={(e) => {
                      setIsCamping(e.target.checked);
                      if (e.target.checked) setHasAdmission(true);
                    }}
                  />
                  캠핑장 이용 고객 (선택 시 입장권 무료 자동 부여)
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasAdmission}
                    disabled={isCamping}
                    onChange={(e) => setHasAdmission(e.target.checked)}
                  />
                  워터파크 입장권 별도 구매 완료
                </label>
              </div>

              {error && <p className="text-sm text-red-600 font-semibold">{error}</p>}
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t shrink-0">
              <button
                onClick={onClose}
                className="px-5 py-2 text-gray-600 font-semibold !rounded-button hover:bg-gray-100 transition-all cursor-pointer"
              >
                취소
              </button>
              <button
                onClick={handleSubmit}
                disabled={pending}
                className="px-6 py-2 bg-primary text-white font-semibold !rounded-button hover:bg-opacity-90 transition-all disabled:opacity-50 cursor-pointer"
              >
                {pending ? '예약 중...' : '예약 확정하기'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
