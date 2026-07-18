'use client';

import { useEffect, useState, useTransition } from 'react';
import {
  listCabanaReservationsForDate,
  updateCabanaReservation,
  cancelCabanaReservation,
} from '@/app/admin/actions';
import type { Database } from '@/types/database';

type Reservation = Database['public']['Tables']['cabana_reservations']['Row'];

const TOTAL_CABANAS = 60;
const SLOTS: Array<'주간' | '야간' | '종일'> = ['주간', '야간', '종일'];

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
  const fullDayLeft = Math.min(dayLeft, nightLeft);

  function refresh() {
    listCabanaReservationsForDate(date).then((data) => setReservations(data as Reservation[]));
  }

  return (
    <div>
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
                className={`aspect-square min-h-[2.75rem] rounded-lg border font-bold text-sm md:text-base transition-all cursor-pointer ${color} ${
                  selectedCabana === cabanaNo ? 'ring-2 ring-offset-2 ring-primary' : ''
                }`}
              >
                {cabanaNo}
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
        </div>
      </div>

      {selectedCabana && (
        <div className="mt-6 bg-white rounded-xl shadow p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg text-gray-900">{selectedCabana}번 케노피 상세</h3>
            <button
              onClick={() => setSelectedCabana(null)}
              className="text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <i className="ri-close-line text-2xl"></i>
            </button>
          </div>

          <div className="grid gap-2">
            {SLOTS.map((slot) => {
              const match = reservations.find(
                (r) => r.cabana_no === selectedCabana && (r.time_type === slot || r.time_type === '종일')
              );
              return (
                <div
                  key={slot}
                  className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 rounded-lg bg-gray-50"
                >
                  <span className="font-bold text-sm text-gray-500 w-14 shrink-0">[{slot}]</span>
                  {match ? (
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
                  ) : (
                    <span className="flex-1 text-sm text-gray-400">예약 없음 (공석)</span>
                  )}
                </div>
              );
            })}
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
      )}
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
  const [isCamping, setIsCamping] = useState(reservation.is_camping);
  const [hasAdmission, setHasAdmission] = useState(reservation.has_admission);
  const [pending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      await updateCabanaReservation(reservation.id, {
        name,
        phone,
        guest_count: guestCount,
        time_type: timeType,
        is_camping: isCamping,
        has_admission: hasAdmission,
      });
      onSaved();
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
      </div>
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
