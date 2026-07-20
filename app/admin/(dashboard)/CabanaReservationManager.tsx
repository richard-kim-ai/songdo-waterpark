'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import {
  listCabanaReservationsForDate,
  getCabanaMonthSummary,
  createCabanaReservationAdmin,
  updateCabanaReservation,
  cancelCabanaReservation,
} from '@/app/admin/actions';
import { DISCOUNT_TYPES, DISCOUNT_MULTIPLIER, type DiscountType } from '@/lib/cabana-pricing';
import type { Database } from '@/types/database';

type Reservation = Database['public']['Tables']['cabana_reservations']['Row'];

const TOTAL_CABANAS = 60;
const TIME_TYPES = ['주간', '야간', '종일'] as const;

type CategorySummary = Record<string, { count: number; revenue: number }>;
type MonthSummary = {
  dateCounts: Record<string, number>;
  byType: CategorySummary;
  byCategory: CategorySummary;
  camping: { count: number; revenue: number };
  priceByType: Record<string, number>;
};
const EMPTY_SUMMARY: MonthSummary = {
  dateCounts: {},
  byType: {},
  byCategory: {},
  camping: { count: 0, revenue: 0 },
  priceByType: {},
};

function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const won = (n: number) => `${n.toLocaleString('ko-KR')}원`;

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
  const [creating, setCreating] = useState(false);

  const [monthCursor, setMonthCursor] = useState(() => {
    const [y, m] = initialDate.split('-').map(Number);
    return new Date(y, m - 1, 1);
  });
  const [monthSummary, setMonthSummary] = useState<MonthSummary>(EMPTY_SUMMARY);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const posRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

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

  // 날짜 입력창에서 직접 다른 달로 이동했을 때만 캘린더/판매현황도 그 달로 이동
  useEffect(() => {
    const [y, m] = date.split('-').map(Number);
    setMonthCursor((prev) =>
      prev.getFullYear() === y && prev.getMonth() === m - 1 ? prev : new Date(y, m - 1, 1)
    );
  }, [date]);

  useEffect(() => {
    const year = monthCursor.getFullYear();
    const month = monthCursor.getMonth();
    const monthStart = toDateStr(new Date(year, month, 1));
    const monthEnd = toDateStr(new Date(year, month + 1, 0));
    setSummaryLoading(true);
    getCabanaMonthSummary(monthStart, monthEnd)
      .then(setMonthSummary)
      .catch(() => setMonthSummary(EMPTY_SUMMARY))
      .finally(() => setSummaryLoading(false));
  }, [monthCursor]);

  useEffect(() => {
    function handleChange() {
      setIsFullscreen(!!document.fullscreenElement);
    }
    document.addEventListener('fullscreenchange', handleChange);
    return () => document.removeEventListener('fullscreenchange', handleChange);
  }, []);

  function toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      posRef.current?.requestFullscreen().catch(() => {
        // 브라우저/환경이 전체화면 API를 거부하는 경우 조용히 무시 (예: 임베드된 iframe)
      });
    }
  }

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
    const year = monthCursor.getFullYear();
    const month = monthCursor.getMonth();
    getCabanaMonthSummary(
      toDateStr(new Date(year, month, 1)),
      toDateStr(new Date(year, month + 1, 0))
    )
      .then(setMonthSummary)
      .catch(() => setMonthSummary(EMPTY_SUMMARY));
  }

  return (
    <div>
      <div className="flex flex-col lg:flex-row gap-6 mb-6">
        <div className="lg:w-72 shrink-0">
          <ReservationCalendar
            selectedDate={date}
            onSelectDate={setDate}
            cursor={monthCursor}
            onCursorChange={setMonthCursor}
            dateCounts={monthSummary.dateCounts}
            loading={summaryLoading}
          />
        </div>
        <div className="flex-1">
          <SalesDashboard
            byType={monthSummary.byType}
            byCategory={monthSummary.byCategory}
            camping={monthSummary.camping}
            loading={summaryLoading}
          />
        </div>
      </div>

      <div
        ref={posRef}
        className={
          isFullscreen ? 'fixed inset-0 z-50 bg-gray-100 overflow-y-auto p-6' : ''
        }
      >
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
          <button
            onClick={toggleFullscreen}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-semibold !rounded-button hover:bg-opacity-90 transition-all cursor-pointer"
          >
            <i className={isFullscreen ? 'ri-fullscreen-exit-line' : 'ri-fullscreen-line'}></i>
            {isFullscreen ? '전체화면 종료' : '전체화면 (POS 모드)'}
          </button>
        </div>

        <div className="bg-white rounded-xl shadow p-4 md:p-6">
          <p className="text-xs text-gray-500 mb-4">
            케노피 번호를 누르면 해당 구역의 예약 정보를 확인·수정·취소할 수 있습니다.
          </p>
          <div
            className={`grid grid-cols-6 sm:grid-cols-8 lg:grid-cols-10 gap-2 md:gap-3 ${
              loading ? 'opacity-50 pointer-events-none' : ''
            } ${isFullscreen ? 'xl:grid-cols-12' : ''}`}
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
                    setCreating(false);
                  }}
                  className={`aspect-square min-h-[2.75rem] rounded-lg border font-bold text-sm md:text-base transition-all cursor-pointer flex flex-col items-center justify-center ${color} ${
                    selectedCabana === cabanaNo ? 'ring-2 ring-offset-2 ring-primary' : ''
                  } ${isFullscreen ? 'md:text-lg min-h-[4rem]' : ''}`}
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

        {/* 전체화면(POS) 모드일 때도 상세/수정 팝업이 화면 위에 뜨도록 posRef 안쪽에 배치 */}
        {selectedCabana && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
            onClick={() => {
              setSelectedCabana(null);
              setCreating(false);
            }}
          >
            <div
              className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-4 md:p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg text-gray-900">{selectedCabana}번 케노피 상세</h3>
                <button
                  onClick={() => {
                    setSelectedCabana(null);
                    setCreating(false);
                  }}
                  aria-label="닫기"
                  className="text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>

              {(() => {
                const cabanaMatches = reservations.filter((r) => r.cabana_no === selectedCabana);
                const takenTypes = new Set(cabanaMatches.map((r) => r.time_type));
                const isFullyBooked =
                  takenTypes.has('종일') || (takenTypes.has('주간') && takenTypes.has('야간'));
                const availableTypes = TIME_TYPES.filter((t) => {
                  if (t === '종일') return cabanaMatches.length === 0;
                  return !takenTypes.has(t) && !takenTypes.has('종일');
                });

                return (
                  <>
                    <div className="grid gap-2">
                      {cabanaMatches.length === 0 ? (
                        <div className="px-4 py-3 rounded-lg bg-gray-50 text-sm text-gray-400">
                          예약 없음 (공석)
                        </div>
                      ) : (
                        cabanaMatches.map((match) => (
                          <div
                            key={match.id}
                            className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 rounded-lg bg-gray-50"
                          >
                            <span className="font-bold text-sm text-gray-500 w-14 shrink-0">
                              [{match.time_type}]
                            </span>
                            <button
                              onClick={() => {
                                setEditing(match);
                                setCreating(false);
                              }}
                              className="flex-1 text-left text-sm text-gray-800 hover:text-primary cursor-pointer"
                            >
                              <strong>{match.name}</strong> ({match.phone}) · {match.guest_count}명 ·
                              예약번호 {match.reservation_no}
                              {match.is_camping && (
                                <span className="ml-2 text-xs text-primary font-semibold">
                                  캠핑객
                                </span>
                              )}
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    {!isFullyBooked && !editing && !creating && (
                      <button
                        onClick={() => setCreating(true)}
                        className="w-full mt-3 px-4 py-2 border border-dashed border-primary/40 text-primary text-sm font-semibold rounded-lg hover:bg-primary/5 transition-all cursor-pointer"
                      >
                        <i className="ri-add-line mr-1"></i> 새 예약 등록
                      </button>
                    )}

                    {creating && (
                      <CreatePanel
                        cabanaNo={selectedCabana!}
                        reservationDate={date}
                        availableTypes={availableTypes}
                        priceByType={monthSummary.priceByType}
                        onCancel={() => setCreating(false)}
                        onCreated={() => {
                          setCreating(false);
                          refresh();
                        }}
                      />
                    )}
                  </>
                );
              })()}

              {editing && (
                <EditPanel
                  reservation={editing}
                  priceByType={monthSummary.priceByType}
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
    </div>
  );
}

function SalesDashboard({
  byType,
  byCategory,
  camping,
  loading,
}: {
  byType: CategorySummary;
  byCategory: CategorySummary;
  camping: { count: number; revenue: number };
  loading: boolean;
}) {
  const totalCount = TIME_TYPES.reduce((sum, t) => sum + (byType[t]?.count ?? 0), 0);
  const totalRevenue = TIME_TYPES.reduce((sum, t) => sum + (byType[t]?.revenue ?? 0), 0);

  return (
    <div className={`bg-white rounded-xl shadow p-4 md:p-6 h-full ${loading ? 'opacity-50' : ''}`}>
      <h3 className="font-bold text-gray-900 mb-4">이번 달 판매 현황 (총판매량)</h3>

      <p className="text-xs font-semibold text-gray-500 mb-2">타임별</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        {TIME_TYPES.map((type) => (
          <div key={type} className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm font-semibold text-gray-600">{type}권</p>
            <p className="text-2xl font-bold text-primary mt-1">{byType[type]?.count ?? 0}건</p>
            <p className="text-xs text-gray-500 mt-1">{won(byType[type]?.revenue ?? 0)}</p>
          </div>
        ))}
      </div>

      <p className="text-xs font-semibold text-gray-500 mb-2">구분별</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        {DISCOUNT_TYPES.map((category) => (
          <div key={category} className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm font-semibold text-gray-600">{category}</p>
            <p className="text-2xl font-bold text-primary mt-1">
              {byCategory[category]?.count ?? 0}건
            </p>
            <p className="text-xs text-gray-500 mt-1">{won(byCategory[category]?.revenue ?? 0)}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between bg-primary/5 rounded-lg px-4 py-3 mb-4">
        <span className="text-sm font-semibold text-gray-700">
          <i className="ri-campfire-line mr-1 text-primary"></i>캠핑객 예약
        </span>
        <span className="text-right">
          <span className="font-bold text-gray-900">{camping.count}건</span>
          <span className="mx-2 text-gray-300">·</span>
          <span className="font-bold text-primary">{won(camping.revenue)}</span>
        </span>
      </div>

      <div className="flex items-center justify-between border-t pt-4">
        <span className="font-bold text-gray-900">총 판매 수량 / 판매액</span>
        <span className="text-right">
          <span className="font-bold text-gray-900">{totalCount}건</span>
          <span className="mx-2 text-gray-300">·</span>
          <span className="font-bold text-lg text-primary">{won(totalRevenue)}</span>
        </span>
      </div>
    </div>
  );
}

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

function ReservationCalendar({
  selectedDate,
  onSelectDate,
  cursor,
  onCursorChange,
  dateCounts,
  loading,
}: {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  cursor: Date;
  onCursorChange: (cursor: Date) => void;
  dateCounts: Record<string, number>;
  loading: boolean;
}) {
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startWeekday = new Date(year, month, 1).getDay();
  const todayStr = toDateStr(new Date());
  const totalThisMonth = Object.values(dateCounts).reduce((sum, n) => sum + n, 0);

  const cells: (number | null)[] = [
    ...Array.from({ length: startWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className={`bg-white rounded-xl shadow p-3 ${loading ? 'opacity-50' : ''}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-bold text-gray-900">예약 캘린더</h3>
        <span className="text-[10px] text-gray-500">이번 달 {totalThisMonth}건</span>
      </div>
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={() => onCursorChange(new Date(year, month - 1, 1))}
          aria-label="이전 달"
          className="w-5 h-5 flex items-center justify-center rounded hover:bg-gray-100 cursor-pointer"
        >
          <i className="ri-arrow-left-s-line text-sm"></i>
        </button>
        <span className="text-xs font-bold text-gray-800">
          {year}.{month + 1}
        </span>
        <button
          onClick={() => onCursorChange(new Date(year, month + 1, 1))}
          aria-label="다음 달"
          className="w-5 h-5 flex items-center justify-center rounded hover:bg-gray-100 cursor-pointer"
        >
          <i className="ri-arrow-right-s-line text-sm"></i>
        </button>
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {WEEKDAY_LABELS.map((d) => (
          <div key={d} className="text-[9px] font-bold text-gray-400 text-center py-0.5">
            {d}
          </div>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} />;
          const dateStr = toDateStr(new Date(year, month, day));
          const count = dateCounts[dateStr] ?? 0;
          const isSelected = dateStr === selectedDate;
          const isToday = dateStr === todayStr;
          return (
            <button
              key={dateStr}
              onClick={() => onSelectDate(dateStr)}
              className={`aspect-square rounded text-[10px] flex flex-col items-center justify-center cursor-pointer transition-all ${
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
                  className={`text-[8px] leading-none ${isSelected ? 'text-white' : 'text-primary'}`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DiscountTypeToggle({
  discountType,
  onChange,
}: {
  discountType: DiscountType;
  onChange: (t: DiscountType) => void;
}) {
  return (
    <div>
      <label className="block text-sm text-gray-600 mb-1">예약 구분</label>
      <div className="flex flex-wrap gap-2">
        {(['단체', '장애인/유공자'] as const).map((t) => {
          const active = discountType === t;
          return (
            <button
              key={t}
              type="button"
              onClick={() => onChange(active ? '일반' : t)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all cursor-pointer ${
                active
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {t} ({Math.round((1 - DISCOUNT_MULTIPLIER[t]) * 100)}% 할인)
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PricePreview({
  timeType,
  discountType,
  priceByType,
}: {
  timeType: string;
  discountType: DiscountType;
  priceByType: Record<string, number>;
}) {
  const basePrice = priceByType[timeType] ?? 0;
  const finalPrice = Math.round(basePrice * DISCOUNT_MULTIPLIER[discountType]);

  return (
    <div className="flex items-center justify-between bg-white rounded-lg px-4 py-3 border border-gray-200">
      <span className="text-sm text-gray-500">예상 결제 금액 ({discountType})</span>
      <span className="text-right">
        {discountType !== '일반' && (
          <span className="text-xs text-gray-400 line-through mr-2">{won(basePrice)}</span>
        )}
        <span className="font-bold text-primary">{won(finalPrice)}</span>
      </span>
    </div>
  );
}

function CreatePanel({
  cabanaNo,
  reservationDate,
  availableTypes,
  priceByType,
  onCancel,
  onCreated,
}: {
  cabanaNo: number;
  reservationDate: string;
  availableTypes: readonly string[];
  priceByType: Record<string, number>;
  onCancel: () => void;
  onCreated: () => void;
}) {
  const [timeType, setTimeType] = useState(availableTypes[0] ?? '주간');
  const [discountType, setDiscountType] = useState<DiscountType>('일반');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [guestCount, setGuestCount] = useState(1);
  const [isCamping, setIsCamping] = useState(false);
  const [hasAdmission, setHasAdmission] = useState(false);
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();

  function handleCreate() {
    setError('');
    if (!name.trim() || !phone.trim()) {
      setError('예약자 성함과 연락처를 입력해주세요.');
      return;
    }
    startTransition(async () => {
      try {
        await createCabanaReservationAdmin({
          reservation_date: reservationDate,
          cabana_no: cabanaNo,
          time_type: timeType,
          name: name.trim(),
          phone: phone.trim(),
          guest_count: guestCount,
          is_camping: isCamping,
          has_admission: hasAdmission,
          discount_type: discountType,
        });
        onCreated();
      } catch (err) {
        setError(err instanceof Error ? err.message : '등록 중 오류가 발생했습니다.');
      }
    });
  }

  return (
    <div className="mt-4 p-4 md:p-5 bg-blue-50 rounded-lg border border-primary/20">
      <h4 className="font-bold text-gray-900 mb-3">
        {cabanaNo}번 케노피 · {reservationDate} 새 예약 등록
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <label className="text-sm text-gray-600">
          타임 구분
          <select
            value={timeType}
            onChange={(e) => setTimeType(e.target.value)}
            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {availableTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
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
          고객성함
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="홍길동"
            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </label>
        <label className="text-sm text-gray-600">
          연락처
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="010-0000-0000"
            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </label>
      </div>

      <div className="mb-3">
        <DiscountTypeToggle discountType={discountType} onChange={setDiscountType} />
      </div>
      <div className="mb-3">
        <PricePreview timeType={timeType} discountType={discountType} priceByType={priceByType} />
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
          캠핑객 예약
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
          onClick={handleCreate}
          disabled={pending}
          className="px-5 py-2 bg-primary text-white font-semibold !rounded-button hover:bg-opacity-90 transition-all disabled:opacity-50 cursor-pointer"
        >
          {pending ? '등록 중...' : '예약 등록'}
        </button>
        <button
          onClick={onCancel}
          disabled={pending}
          className="px-5 py-2 text-gray-600 font-semibold !rounded-button hover:bg-gray-100 transition-all cursor-pointer"
        >
          취소
        </button>
      </div>
    </div>
  );
}

function EditPanel({
  reservation,
  priceByType,
  onCancelEdit,
  onSaved,
  onCancelled,
}: {
  reservation: Reservation;
  priceByType: Record<string, number>;
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
  const [discountType, setDiscountType] = useState<DiscountType>(
    (reservation.discount_type as DiscountType) ?? '일반'
  );
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
          discount_type: discountType,
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

  function handlePrint() {
    const price = Math.round((priceByType[timeType] ?? 0) * DISCOUNT_MULTIPLIER[discountType]);
    const rows = [
      ['예약번호', reservation.reservation_no],
      ['이름', name],
      ['전화번호', phone],
      ['인원', `${guestCount}명`],
      ['타임 구분', timeType],
      ['케노피 번호', `${cabanaNo}번`],
      ['할인 구분', discountType],
      ['결제 금액', won(price)],
    ];
    const win = window.open('', '_blank', 'width=380,height=600');
    if (!win) return;
    win.document.write(`<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>케노피 예약 확인증</title>
<style>
  body { font-family: -apple-system, sans-serif; padding: 24px; color: #111; }
  h2 { text-align: center; margin-bottom: 24px; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 10px 4px; border-bottom: 1px solid #eee; font-size: 14px; }
  td:first-child { color: #666; width: 100px; }
  td:last-child { font-weight: 600; }
</style>
</head>
<body>
  <h2>케노피 예약 확인증</h2>
  <table>
    ${rows.map(([label, value]) => `<tr><td>${label}</td><td>${value}</td></tr>`).join('')}
  </table>
</body>
</html>`);
    win.document.close();
    win.focus();
    win.print();
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

      <div className="mb-3">
        <DiscountTypeToggle discountType={discountType} onChange={setDiscountType} />
      </div>
      <div className="mb-3">
        <PricePreview timeType={timeType} discountType={discountType} priceByType={priceByType} />
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
          캠핑객 예약
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
          onClick={handlePrint}
          disabled={pending}
          className="px-5 py-2 bg-gray-900 text-white font-semibold !rounded-button hover:bg-opacity-90 transition-all disabled:opacity-50 cursor-pointer"
        >
          <i className="ri-printer-line mr-1"></i> 출력하기
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
