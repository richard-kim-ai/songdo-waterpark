'use client';

import { useEffect, useRef, useState } from 'react';
import {
  getCabanaDailySales,
  getCabanaSalesCalendar,
  type DailySalesItem,
} from '@/app/admin/actions';
import { ZONE_TYPES, ZONE_TYPE_LABELS } from '@/lib/cabana-pricing';

type CalendarData = Record<string, { total: number; visited: number; revenue: number }>;
type DailyData = {
  items: DailySalesItem[];
  visited: { count: number; revenue: number };
  noShow: { count: number; revenue: number };
  pending: { count: number; revenue: number };
  byZone: Record<string, { count: number; revenue: number }>;
};

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];
const won = (n: number) => `${n.toLocaleString('ko-KR')}원`;
// 달력 칸에 들어갈 만원 단위 축약 (50000 → "5만", 46000 → "4.6만")
function wonShort(n: number) {
  if (n <= 0) return '';
  if (n < 10000) return `${Math.round(n / 1000)}천`;
  const man = n / 10000;
  return `${Number.isInteger(man) ? man : man.toFixed(1)}만`;
}

function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function formatDateKorean(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const weekday = WEEKDAY_LABELS[new Date(y, m - 1, d).getDay()];
  return `${y}년 ${m}월 ${d}일 (${weekday})`;
}

export default function CabanaSalesManager({
  initialDate,
  initialCalendar,
  initialDaily,
}: {
  initialDate: string;
  initialCalendar: CalendarData;
  initialDaily: DailyData;
}) {
  const [date, setDate] = useState(initialDate);
  const [calendar, setCalendar] = useState<CalendarData>(initialCalendar);
  const [daily, setDaily] = useState<DailyData>(initialDaily);
  const [dailyLoading, setDailyLoading] = useState(false);
  const [calLoading, setCalLoading] = useState(false);
  const [monthCursor, setMonthCursor] = useState(() => {
    const [y, m] = initialDate.split('-').map(Number);
    return new Date(y, m - 1, 1);
  });

  // 초기 렌더는 서버에서 이미 받아온 값을 쓰므로 마운트 시 재조회를 건너뛴다.
  const skipDailyRef = useRef(true);
  const skipCalRef = useRef(true);

  useEffect(() => {
    if (skipDailyRef.current) {
      skipDailyRef.current = false;
      return;
    }
    setDailyLoading(true);
    getCabanaDailySales(date)
      .then((d) => setDaily(d as DailyData))
      .finally(() => setDailyLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  useEffect(() => {
    if (skipCalRef.current) {
      skipCalRef.current = false;
      return;
    }
    const year = monthCursor.getFullYear();
    const month = monthCursor.getMonth();
    setCalLoading(true);
    getCabanaSalesCalendar(toDateStr(new Date(year, month, 1)), toDateStr(new Date(year, month + 1, 0)))
      .then((c) => setCalendar(c as CalendarData))
      .finally(() => setCalLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthCursor]);

  const monthTotal = Object.values(calendar).reduce((sum, d) => sum + d.revenue, 0);
  const monthVisited = Object.values(calendar).reduce((sum, d) => sum + d.visited, 0);

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="lg:w-80 shrink-0">
        <SalesCalendar
          selectedDate={date}
          onSelectDate={setDate}
          cursor={monthCursor}
          onCursorChange={setMonthCursor}
          calendar={calendar}
          loading={calLoading}
          monthTotal={monthTotal}
          monthVisited={monthVisited}
        />
      </div>

      <div className={`flex-1 space-y-6 ${dailyLoading ? 'opacity-50' : ''}`}>
        <div className="bg-white rounded-xl shadow p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">{formatDateKorean(date)} 확정 매출</h3>
            <span className="text-2xl font-bold text-primary">{won(daily.visited.revenue)}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm font-semibold text-gray-600">
                <i className="ri-user-follow-line mr-1 text-green-600"></i>방문 완료
              </p>
              <p className="text-2xl font-bold text-green-600 mt-1">{daily.visited.count}건</p>
              <p className="text-xs text-gray-500 mt-1">{won(daily.visited.revenue)}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm font-semibold text-gray-600">
                <i className="ri-time-line mr-1 text-gray-400"></i>미확인(대기)
              </p>
              <p className="text-2xl font-bold text-gray-700 mt-1">{daily.pending.count}건</p>
              <p className="text-xs text-gray-500 mt-1">{won(daily.pending.revenue)}</p>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <p className="text-sm font-semibold text-gray-600">
                <i className="ri-user-unfollow-line mr-1 text-red-500"></i>노쇼
              </p>
              <p className="text-2xl font-bold text-red-500 mt-1">{daily.noShow.count}건</p>
              <p className="text-xs text-gray-500 mt-1">{won(daily.noShow.revenue)}</p>
            </div>
          </div>

          <p className="text-xs font-semibold text-gray-500 mb-2">
            상품별 확정 매출 (방문 완료 기준)
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {ZONE_TYPES.map((zt) => {
              const z = daily.byZone[zt] ?? { count: 0, revenue: 0 };
              return (
                <div key={zt} className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-semibold text-gray-600">{ZONE_TYPE_LABELS[zt]}</p>
                  <p className="text-xl font-bold text-primary mt-1">{won(z.revenue)}</p>
                  <p className="text-xs text-gray-500 mt-1">{z.count}건</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-4 md:p-6">
          <h3 className="font-bold text-gray-900 mb-4">
            예약 리스트 <span className="text-sm font-normal text-gray-400">({daily.items.length}건)</span>
          </h3>
          {daily.items.length === 0 ? (
            <p className="text-sm text-gray-400 bg-gray-50 rounded-lg px-4 py-6 text-center">
              해당 날짜의 예약이 없습니다.
            </p>
          ) : (
            <div className="space-y-2">
              {daily.items.map((it) => (
                <div
                  key={it.id}
                  className={`flex flex-wrap items-center gap-2 px-4 py-3 rounded-lg ${
                    it.status === 'visited'
                      ? 'bg-green-50'
                      : it.status === 'noShow'
                        ? 'bg-red-50'
                        : 'bg-gray-50'
                  }`}
                >
                  <span className="font-semibold text-sm text-gray-800 w-28 shrink-0">
                    {it.zoneLabel}
                    {it.hasTimeType ? ` · ${it.timeType}` : ''}
                  </span>
                  <span className="text-sm text-gray-600 flex-1 min-w-0">
                    {it.cabanaNo}번 · {it.name} ({it.phone}) · {it.guestCount}명
                    {it.isCamping && (
                      <span className="ml-2 text-xs text-primary font-semibold">캠핑객</span>
                    )}
                  </span>
                  <StatusBadge status={it.status} />
                  <span
                    className={`font-bold text-sm w-24 text-right shrink-0 ${
                      it.status === 'noShow' ? 'text-gray-400 line-through' : 'text-gray-900'
                    }`}
                  >
                    {won(it.price)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: DailySalesItem['status'] }) {
  if (status === 'visited')
    return (
      <span className="text-xs font-bold text-green-600 bg-green-100 rounded px-2 py-0.5 shrink-0">
        방문완료
      </span>
    );
  if (status === 'noShow')
    return (
      <span className="text-xs font-bold text-red-500 bg-red-100 rounded px-2 py-0.5 shrink-0">
        노쇼
      </span>
    );
  return (
    <span className="text-xs font-bold text-gray-500 bg-gray-200 rounded px-2 py-0.5 shrink-0">
      대기
    </span>
  );
}

function SalesCalendar({
  selectedDate,
  onSelectDate,
  cursor,
  onCursorChange,
  calendar,
  loading,
  monthTotal,
  monthVisited,
}: {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  cursor: Date;
  onCursorChange: (cursor: Date) => void;
  calendar: CalendarData;
  loading: boolean;
  monthTotal: number;
  monthVisited: number;
}) {
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startWeekday = new Date(year, month, 1).getDay();
  const todayStr = toDateStr(new Date());

  const cells: (number | null)[] = [
    ...Array.from({ length: startWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className={`bg-white rounded-xl shadow p-4 ${loading ? 'opacity-50' : ''}`}>
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-bold text-gray-900">매출 캘린더</h3>
        <button
          onClick={() => {
            onCursorChange(new Date(year, month, 1));
          }}
          className="text-[10px] text-gray-400 hover:text-primary cursor-pointer"
        >
          이번 달 확정 {monthVisited}건 · {won(monthTotal)}
        </button>
      </div>
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={() => onCursorChange(new Date(year, month - 1, 1))}
          aria-label="이전 달"
          className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 cursor-pointer"
        >
          <i className="ri-arrow-left-s-line"></i>
        </button>
        <span className="text-sm font-bold text-gray-800">
          {year}.{month + 1}
        </span>
        <button
          onClick={() => onCursorChange(new Date(year, month + 1, 1))}
          aria-label="다음 달"
          className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 cursor-pointer"
        >
          <i className="ri-arrow-right-s-line"></i>
        </button>
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {WEEKDAY_LABELS.map((d) => (
          <div key={d} className="text-[10px] font-bold text-gray-400 text-center py-1">
            {d}
          </div>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} />;
          const dateStr = toDateStr(new Date(year, month, day));
          const info = calendar[dateStr];
          const isSelected = dateStr === selectedDate;
          const isToday = dateStr === todayStr;
          const revenue = info?.revenue ?? 0;
          return (
            <button
              key={dateStr}
              onClick={() => onSelectDate(dateStr)}
              className={`aspect-square rounded flex flex-col items-center justify-center cursor-pointer transition-all p-0.5 ${
                isSelected
                  ? 'bg-primary text-white'
                  : revenue > 0
                    ? 'bg-primary/10 hover:bg-primary/20'
                    : 'text-gray-600 hover:bg-gray-100'
              } ${isToday && !isSelected ? 'ring-1 ring-primary/50' : ''}`}
            >
              <span className={`text-xs ${revenue > 0 && !isSelected ? 'font-bold text-primary' : ''}`}>
                {day}
              </span>
              {revenue > 0 && (
                <span
                  className={`text-[9px] leading-none font-semibold ${
                    isSelected ? 'text-white' : 'text-primary'
                  }`}
                >
                  {wonShort(revenue)}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <p className="text-[10px] text-gray-400 mt-2">숫자 아래 금액 = 그 날의 확정 매출(방문 완료 기준)</p>
    </div>
  );
}
