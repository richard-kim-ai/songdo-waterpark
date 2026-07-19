'use client';

import { useEffect, useState, useTransition } from 'react';
import {
  listCabanaReservationsForDate,
  listCabanaReservationDateCounts,
  updateCabanaReservation,
  cancelCabanaReservation,
} from '@/app/admin/actions';
import type { Database } from '@/types/database';

type Reservation = Database['public']['Tables']['cabana_reservations']['Row'];

const TOTAL_CABANAS = 60;

function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function CabanaReservationManager({
  initialDate,
  initialReservations,
}: {
  initialDate: string;
  initialReservations: Reservation[];
}) {
  const [date, setDate] = useState(initialDate);
  const [reservations, setReservations] = useState<Reservation[]>(initialReservations);
  const [loading, setLoading] = useState(false);
  const [selectedCabana, setSelectedCabana] = useState<number | null>(null);
  const [editing, setEditing] = useState<Reservation | null>(null);

  useEffect(() => {
    if (date === initialDate && reservations === initialReservations) return;
    setLoading(true);
    setSelectedCabana(null);
    setEditing(null);
    listCabanaReservationsForDate(date)
      .then((data) => setReservations(data as Reservation[]))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const dayBooked = reservations.filter((r) => r.time_type === '주간' || r.time_type === '종일').length;
  const nightBooked = reservations.filter((r) => r.time_type === '야간' || r.time_type === '종일').length;
  const dayLeft = Math.max(0, TOTAL_CABANAS - dayBooked);
  const nightLeft = Math.max(0, TOTAL_CABANAS - nightBooked);
  // 종일 예약은 완전히 비어있는 케노피만 배정 가능하므로 min(주간,야간)이 아니라
  // 아무 예약도 없는 케노피 수로 계산 (주간/야간이 서로 다른 케노피에 흩어져 있으면
  // min() 계산은 실제보다 종일 잔여를 과대평가함).
  const bookedCabanaNos = new Set(reservations.map((r) => r.cabana_no));
  const fullDayLeft = Math.max(0, TOTAL_CABANAS - bookedCabanaNos.size);

  function refresh() {
    listCabanaReservationsForDate(date).then((data) => setReservations(data as Reservation[]));
  }

  return (
    <div>
      <ReservationCalendar selectedDate={date} onSelectDate={setDate} />

      <div className="flex flex-wrap items-center gap-4 mb-6 bg-white rounded-xl shadow p-4">
        <label className="font-bold text-gray-700 text-sm">조회 일자</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <div className="flex gap-4 text-sm ml-auto">
          <span>
            ☀️ 주간 잔여 <strong>{dayLeft}</strong>/{TOTAL_CABANAS}
          </span>
          <span>
            🌙 야간 잔여 <strong>{nightLeft}</strong>/{TOTAL_CABANAS}
          </span>
          <span>
            🎟️ 종일 가능 <strong>{fullDayLeft}</strong>/{TOTAL_CABANAS}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-4 md:p-6">
        <p className="text-xs text-gray-500 mb-4">
          케노피 번호를 누르면 해당 구역의 예약 정보를 확인·수정·취소할 수 있습니다.
        </p>
        <div
          className={`grid grid-cols-6 sm:grid-cols-8 lg:grid-cols-10 gap-2 md:gap-3 ${
            loading ? 'opacity-50 pointer-events-none' : ''
          }`}
        >
          {Array.from({ length: TOTAL_CABANAS }, (_, i) => {
            const cabanaNo = i + 1;
            const matches = reservations.filter((r) => r.cabana_no === cabanaNo);
            const isFull = matches.some((r) => r.time_type === '종일') || matches.length >= 2;
            const isPart = matches.length === 1 && matches[0].time_type !== '종일';
            const hasDay = matches.some((r) => r.time_type === '주간');
            const hasNight = matches.some((r) => r.time_type === '야간');
            const hasFullDay = matches.some((r) => r.time_type === '종일');

            let color = 'bg-gray-100 text-gray-600 border-gray-200';
            if (isFull) color = 'bg-red-500 text-white border-red-500';
            else if (isPart) color = 'bg-amber-400 text-white border-amber-400';

            return (
              <button
                key={cabanaNo}
                onClick={() => {
                  setSelectedCabana(cabanaNo);
                  setEditing(null);
                }}
                className={`aspect-square min-h-[2.75rem] rounded-lg border font-bold text-sm md:text-base transition-all cursor-pointer flex flex-col items-center justify-center ${color} ${
                  selectedCabana === cabanaNo ? 'ring-2 ring-offset-2 ring-primary' : ''
                }`}
              >
                <span>{cabanaNo}</span>
                <span className="flex justify-center gap-0.5 mt-0.5">
                  <span
                    title="주간"
                    className={`w-1.5 h-1.5 rounded-full ${hasDay ? 'bg-white' : 'bg-white/25'}`}
                  />
                  <span
                    title="야간"
                    className={`w-1.5 h-1.5 rounded-full ${hasNight ? 'bg-white' : 'bg-white/25'}`}
                  />
                  <span
                    title="종일"
                    className={`w-1.5 h-1.5 rounded-full ${hasFullDay ? 'bg-white' : 'bg-white/25'}`}
                  />
                </span>
              </button>
            );
          })}
        </div>
        <div className="flex gap-4 mt-4 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-gray-100 border border-gray-200 inline-block"></span>
            공석
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-amber-400 inline-block"></span>
            부분 예약
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-red-500 inline-block"></span>
            마감
          </span>
          <span className="ml-2 border-l pl-4">점1=주간 · 점2=야간 · 점3=종일 (칸 안의 점으로 예약된 타임 표시)</span>
        </div>
      </div>

      {selectedCabana && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={() => setSelectedCabana(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-4 md:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-gray-900">{selectedCabana}번 케노피 상세</h3>
              <button
                onClick={() => setSelectedCabana(null)}
                aria-label="닫기"
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <i className="ri-close-line text-2xl"></i>
              </button>
            </div>

            <div className="grid gap-2">
              {(() => {
                const cabanaMatches = reservations.filter((r) => r.cabana_no === selectedCabana);
                if (cabanaMatches.length === 0) {
                  return (
                    <div className="px-4 py-3 rounded-lg bg-gray-50 text-sm text-gray-400">
                      예약 없음 (공석)
                    </div>
                  );
                }
                return cabanaMatches.map((match) => (
                  <div
                    key={match.id}
                    className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 rounded-lg bg-gray-50"
                  >
                    <span className="font-bold text-sm text-gray-500 w-14 shrink-0">
                      [{match.time_type}]
                    </span>
                    <button
                      onClick={() => setEditing(match)}
                      className="flex-1 text-left text-sm text-gray-800 hover:text-primary cursor-pointer"
                    >
                      <strong>{match.name}</strong> ({match.phone}) · {match.guest_count}명 ·
                      예약번호 {match.reservation_no}
                      {match.is_camping && (
                        <span className="ml-2 text-xs text-primary font-semibold">캠핑객</span>
                      )}
                    </button>
                  </div>
                ));
              })()}
            </div>

            {editing && (
              <EditPanel
                reservation={editing}
                onCancelEdit={() => setEditing(null)}
                onSaved={() => {
                  setEditing(null);
                  refresh();
                }}
                onCancelled={() => {
                  setEditing(null);
                  setSelectedCabana(null);
                  refresh();
                }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

function ReservationCalendar({
  selectedDate,
  onSelectDate,
}: {
  selectedDate: string;
  onSelectDate: (date: string) => void;
}) {
  const [cursor, setCursor] = useState(() => {
    const [y, m] = selectedDate.split('-').map(Number);
    return new Date(y, m - 1, 1);
  });
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  // 날짜 입력창에서 직접 다른 달로 이동했을 때만 캘린더도 그 달로 이동 (같은 달 안에서
  // 날짜만 바뀔 때는 cursor를 그대로 유지해 불필요한 재조회를 막음)
  useEffect(() => {
    const [y, m] = selectedDate.split('-').map(Number);
    setCursor((prev) =>
      prev.getFullYear() === y && prev.getMonth() === m - 1 ? prev : new Date(y, m - 1, 1)
    );
  }, [selectedDate]);

  useEffect(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const monthStart = toDateStr(new Date(year, month, 1));
    const monthEnd = toDateStr(new Date(year, month + 1, 0));
    setLoading(true);
    listCabanaReservationDateCounts(monthStart, monthEnd)
      .then(setCounts)
      .finally(() => setLoading(false));
  }, [cursor]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startWeekday = new Date(year, month, 1).getDay();
  const todayStr = toDateStr(new Date());
  const totalThisMonth = Object.values(counts).reduce((sum, n) => sum + n, 0);

  const cells: (number | null)[] = [
    ...Array.from({ length: startWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="bg-white rounded-xl shadow p-4 md:p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900">예약 현황 캘린더</h3>
        <span className="text-xs text-gray-500">이번 달 예약 {totalThisMonth}건</span>
      </div>
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setCursor(new Date(year, month - 1, 1))}
          aria-label="이전 달"
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 cursor-pointer"
        >
          <i className="ri-arrow-left-s-line text-xl"></i>
        </button>
        <span className="font-bold text-gray-800">
          {year}년 {month + 1}월
        </span>
        <button
          onClick={() => setCursor(new Date(year, month + 1, 1))}
          aria-label="다음 달"
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 cursor-pointer"
        >
          <i className="ri-arrow-right-s-line text-xl"></i>
        </button>
      </div>
      <div className={`grid grid-cols-7 gap-1 ${loading ? 'opacity-50' : ''}`}>
        {WEEKDAY_LABELS.map((d) => (
          <div key={d} className="text-xs font-bold text-gray-400 text-center py-1">
            {d}
          </div>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} />;
          const dateStr = toDateStr(new Date(year, month, day));
          const count = counts[dateStr] ?? 0;
          const isSelected = dateStr === selectedDate;
          const isToday = dateStr === todayStr;
          return (
            <button
              key={dateStr}
              onClick={() => onSelectDate(dateStr)}
              className={`aspect-square rounded-lg text-sm flex flex-col items-center justify-center cursor-pointer transition-all ${
                isSelected
                  ? 'bg-primary text-white font-bold'
                  : count > 0
                    ? 'bg-primary/10 text-primary font-bold hover:bg-primary/20'
                    : 'text-gray-600 hover:bg-gray-100'
              } ${isToday && !isSelected ? 'ring-1 ring-primary/50' : ''}`}
            >
              <span>{day}</span>
              {count > 0 && (
                <span
                  className={`text-[10px] leading-none mt-0.5 ${isSelected ? 'text-white' : 'text-primary'}`}
                >
                  {count}건
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function EditPanel({
  reservation,
  onCancelEdit,
  onSaved,
  onCancelled,
}: {
  reservation: Reservation;
  onCancelEdit: () => void;
  onSaved: () => void;
  onCancelled: () => void;
}) {
  const [name, setName] = useState(reservation.name);
  const [phone, setPhone] = useState(reservation.phone);
  const [guestCount, setGuestCount] = useState(reservation.guest_count);
  const [timeType, setTimeType] = useState(reservation.time_type);
  const [cabanaNo, setCabanaNo] = useState(reservation.cabana_no);
  const [isCamping, setIsCamping] = useState(reservation.is_camping);
  const [hasAdmission, setHasAdmission] = useState(reservation.has_admission);
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();

  function handleSave() {
    setError('');
    startTransition(async () => {
      try {
        await updateCabanaReservation(reservation.id, {
          name,
          phone,
          guest_count: guestCount,
          time_type: timeType,
          is_camping: isCamping,
          has_admission: hasAdmission,
          cabana_no: cabanaNo,
        });
        onSaved();
      } catch (err) {
        setError(err instanceof Error ? err.message : '저장 중 오류가 발생했습니다.');
      }
    });
  }

  function handleCancelReservation() {
    if (!confirm('정말로 이 예약을 취소하시겠습니까? 취소 후 복구는 불가능합니다.')) return;
    startTransition(async () => {
      await cancelCabanaReservation(reservation.id);
      onCancelled();
    });
  }

  return (
    <div className="mt-4 p-4 md:p-5 bg-blue-50 rounded-lg border border-primary/20">
      <h4 className="font-bold text-gray-900 mb-3">예약 정보 수정</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <label className="text-sm text-gray-600">
          고객성함
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </label>
        <label className="text-sm text-gray-600">
          연락처
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </label>
        <label className="text-sm text-gray-600">
          인원수
          <input
            type="number"
            min={1}
            value={guestCount}
            onChange={(e) => setGuestCount(Number(e.target.value) || 1)}
            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </label>
        <label className="text-sm text-gray-600">
          타임 구분
          <select
            value={timeType}
            onChange={(e) => setTimeType(e.target.value)}
            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="주간">주간</option>
            <option value="야간">야간</option>
            <option value="종일">종일</option>
          </select>
        </label>
        <label className="text-sm text-gray-600">
          케노피 번호 (1~60)
          <input
            type="number"
            min={1}
            max={60}
            value={cabanaNo}
            onChange={(e) => setCabanaNo(Number(e.target.value) || 1)}
            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </label>
      </div>
      {error && <p className="text-sm text-red-600 font-semibold mb-3">{error}</p>}
      <div className="flex flex-wrap gap-4 mb-4 text-sm text-gray-700">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isCamping}
            onChange={(e) => {
              setIsCamping(e.target.checked);
              if (e.target.checked) setHasAdmission(true);
            }}
          />
          캠핑객 소속 유무
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={hasAdmission}
            disabled={isCamping}
            onChange={(e) => setHasAdmission(e.target.checked)}
          />
          입장권 지급/확인 유무
        </label>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleSave}
          disabled={pending}
          className="px-5 py-2 bg-primary text-white font-semibold !rounded-button hover:bg-opacity-90 transition-all disabled:opacity-50 cursor-pointer"
        >
          {pending ? '저장 중...' : '변경내역 저장'}
        </button>
        <button
          onClick={handleCancelReservation}
          disabled={pending}
          className="px-5 py-2 bg-red-50 text-red-600 font-semibold !rounded-button hover:bg-red-100 transition-all disabled:opacity-50 cursor-pointer"
        >
          예약 취소
        </button>
        <button
          onClick={onCancelEdit}
          disabled={pending}
          className="px-5 py-2 text-gray-600 font-semibold !rounded-button hover:bg-gray-100 transition-all cursor-pointer"
        >
          닫기
        </button>
      </div>
    </div>
  );
}
