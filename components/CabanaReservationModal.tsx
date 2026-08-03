'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import {
  getCabanaAvailability,
  createCabanaReservation,
  lookupCabanaReservationsByPhone,
  cancelCabanaReservationByPhone,
  getCabanaDepositPolicy,
  type CabanaProduct,
  type ReservedItem,
  type DepositPolicy,
} from '@/app/cabana-reservation/actions';
import { todaySeoul } from '@/lib/date';
import ImageCarousel from './ImageCarousel';

type GuestPolicy = { baseCount: number; extraFee: number; maxCount: number };
const DEFAULT_GUEST_POLICY: GuestPolicy = {
  baseCount: 4,
  extraFee: 3000,
  maxCount: 6,
};

type LookupReservation = {
  id: string;
  reservation_no: string;
  reservation_date: string;
  zone_type: string;
  time_type: string;
  name: string;
  phone: string;
  guest_count: number;
  cabana_no: number;
  is_visited: boolean;
};

type CartLine = {
  id: string;
  zoneType: string;
  zoneLabel: string;
  timeType: string;
  hasTimeType: boolean;
  name: string;
  unitPrice: number;
  guestCount: number;
  /** 고객이 배치도에서 고른 번호. 0이면 현장 자동 배정. */
  cabanaNo: number;
  /** 자리 번호 선택 단계에서 몇 번까지 그릴지 */
  slotCount: number;
};

// 예약 폼을 4단계로 나눠 모바일에서도 한 화면에 들어오게 한다.
const STEPS = [
  { no: 1, label: '날짜 · 잔여' },
  { no: 2, label: '상품 담기' },
  { no: 3, label: '자리 선택' },
  { no: 4, label: '예약자 확인' },
] as const;

const won = (n: number) => `${n.toLocaleString('ko-KR')}원`;

function productKey(p: { zoneType: string; timeType: string }) {
  return `${p.zoneType}|${p.timeType}`;
}

function today() {
  return todaySeoul();
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

export default function CabanaReservationModal({
  buttonLabel,
  diagramUrls = [],
}: {
  buttonLabel: string;
  /** 자리 번호를 고를 때 함께 보여줄 배치도 이미지 */
  diagramUrls?: string[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full mt-6 px-6 py-4 bg-primary text-white font-bold text-lg !rounded-button hover:bg-opacity-90 transition-all whitespace-nowrap cursor-pointer"
      >
        {buttonLabel}
      </button>
      {open && <ReservationModal onClose={() => setOpen(false)} diagramUrls={diagramUrls} />}
    </>
  );
}

function ReservationModal({
  onClose,
  diagramUrls,
}: {
  onClose: () => void;
  diagramUrls: string[];
}) {
  const [date, setDate] = useState(today());
  const [products, setProducts] = useState<CabanaProduct[]>([]);
  const [guestPolicy, setGuestPolicy] = useState<GuestPolicy>(DEFAULT_GUEST_POLICY);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [selectedKey, setSelectedKey] = useState('');
  const [addGuestCount, setAddGuestCount] = useState(1);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isCamping, setIsCamping] = useState(false);
  const [hasAdmission, setHasAdmission] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ReservedItem[] | null>(null);
  const [pending, startTransition] = useTransition();
  const [showLookup, setShowLookup] = useState(false);
  // 노쇼 방지 예약금: 자리를 직접 지정한 항목에만 적용된다.
  const [depositPolicy, setDepositPolicy] = useState<DepositPolicy | null>(null);
  const [depositorName, setDepositorName] = useState('');
  // 예약금 대신 이용요금 전액을 미리 결제
  const [isFullPayment, setIsFullPayment] = useState(false);
  const [resultDeposit, setResultDeposit] = useState<{
    policy: DepositPolicy;
    total: number;
  } | null>(null);

  useEffect(() => {
    getCabanaDepositPolicy().then((p) => setDepositPolicy(p.enabled ? p : null));
  }, []);

  useEffect(() => {
    let active = true;
    // 날짜가 바뀌면 잔여가 달라지므로 장바구니를 비워 오배정을 막는다.
    setCart([]);
    getCabanaAvailability(date).then((res) => {
      if (!active) return;
      setProducts(res.products);
      setGuestPolicy(res.guestPolicy);
      setSelectedKey((prev) =>
        res.products.some((p) => productKey(p) === prev)
          ? prev
          : res.products[0]
            ? productKey(res.products[0])
            : '',
      );
    });
    return () => {
      active = false;
    };
  }, [date]);

  // zone_type별로 상품을 묶어 잔여 안내 패널과 셀렉트 옵션을 구성.
  const groups = useMemo(() => {
    const map = new Map<string, { zoneLabel: string; items: CabanaProduct[] }>();
    for (const p of products) {
      const g = map.get(p.zoneType) ?? { zoneLabel: p.zoneLabel, items: [] };
      g.items.push(p);
      map.set(p.zoneType, g);
    }
    return Array.from(map.values());
  }, [products]);

  // 장바구니에 담긴 항목이 소진하는 슬롯을 반영한 실시간 잔여 수량.
  // 종일은 슬롯 전체를 차지하고, 주간/야간은 같은 타임·종일과 겹치므로 보수적으로 계산한다.
  function remainingFor(product: CabanaProduct) {
    const consumed = cart.filter((c) => {
      if (c.zoneType !== product.zoneType) return false;
      if (product.timeType === '종일') return true;
      return c.timeType === product.timeType || c.timeType === '종일';
    }).length;
    return Math.max(0, product.left - consumed);
  }

  const selectedProduct = products.find((p) => productKey(p) === selectedKey);

  // 담은 항목별로 고를 수 있는 번호 계산 —
  // 서버가 알려준 예약분 + 장바구니의 다른 항목이 같은 시간대에 이미 잡은 번호를 제외한다.
  function takenNosForLine(line: CartLine) {
    const product = products.find(
      (p) => p.zoneType === line.zoneType && p.timeType === line.timeType,
    );
    const set = new Set<number>(product?.takenNos ?? []);
    for (const other of cart) {
      if (other.id === line.id || other.zoneType !== line.zoneType || other.cabanaNo === 0)
        continue;
      const conflicts =
        line.timeType === '종일' || other.timeType === line.timeType || other.timeType === '종일';
      if (conflicts) set.add(other.cabanaNo);
    }
    return set;
  }

  function setLineNo(id: string, cabanaNo: number) {
    setCart((prev) => prev.map((c) => (c.id === id ? { ...c, cabanaNo } : c)));
  }

  function handleAdd() {
    if (!selectedProduct) return;
    setError('');
    const guestCount = selectedProduct.hasTimeType
      ? Math.max(1, Math.min(addGuestCount, guestPolicy.maxCount))
      : 1;
    setCart((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        zoneType: selectedProduct.zoneType,
        zoneLabel: selectedProduct.zoneLabel,
        timeType: selectedProduct.timeType,
        hasTimeType: selectedProduct.hasTimeType,
        name: selectedProduct.name,
        unitPrice: selectedProduct.price,
        guestCount,
        cabanaNo: 0,
        slotCount: selectedProduct.slotCount,
      },
    ]);
    setAddGuestCount(1);
  }

  function removeLine(id: string) {
    setCart((prev) => prev.filter((c) => c.id !== id));
  }

  function updateLineGuests(id: string, guestCount: number) {
    setCart((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              guestCount: Math.max(1, Math.min(guestCount, guestPolicy.maxCount)),
            }
          : c,
      ),
    );
  }

  function linePrice(line: CartLine) {
    const extra = line.hasTimeType ? Math.max(0, line.guestCount - guestPolicy.baseCount) : 0;
    return line.unitPrice + extra * guestPolicy.extraFee;
  }

  const totalPrice = cart.reduce((sum, line) => sum + linePrice(line), 0);
  const canAdd = !!selectedProduct && remainingFor(selectedProduct) > 0;

  // 자리를 지정한 항목 수 × 예약금. 전액결제를 고르면 이용요금 전액을 미리 받는다.
  const depositLines = cart.filter((c) => c.cabanaNo > 0).length;
  const depositTotal = !depositPolicy
    ? 0
    : isFullPayment
      ? totalPrice
      : depositLines * depositPolicy.amount;
  // 번호를 지정할 수 있는 항목(썬배드처럼 번호가 없는 상품은 제외)
  const numberedLines = cart.filter((c) => c.hasTimeType);

  function goStep(next: number) {
    setError('');
    if (next > 2 && cart.length === 0) {
      setError('예약할 상품을 1개 이상 담아주세요.');
      return;
    }
    setStep(Math.min(4, Math.max(1, next)) as 1 | 2 | 3 | 4);
  }

  function handleSubmit() {
    setError('');
    if (cart.length === 0) {
      setError('예약할 상품을 1개 이상 추가해주세요.');
      return;
    }
    if (!name.trim() || !phone.trim()) {
      setError('예약자 성함과 연락처를 입력해주세요.');
      return;
    }
    startTransition(async () => {
      const fd = new FormData();
      fd.set('reservationDate', date);
      fd.set('name', name.trim());
      fd.set('phone', phone.trim());
      fd.set('isCamping', String(isCamping));
      fd.set('hasAdmission', String(hasAdmission));
      fd.set('depositorName', depositorName.trim());
      fd.set('isFullPayment', String(isFullPayment));
      fd.set(
        'cart',
        JSON.stringify(
          cart.map((c) => ({
            zoneType: c.zoneType,
            timeType: c.timeType,
            guestCount: c.guestCount,
            cabanaNo: c.cabanaNo,
          })),
        ),
      );

      const res = await createCabanaReservation(fd);
      if (res.ok) {
        setResult(res.items);
        setResultDeposit(res.deposit ? { policy: res.deposit, total: res.depositTotal } : null);
      } else {
        setError(res.error);
      }
    });
  }

  const resultTotal = result?.reduce((sum, it) => sum + it.price, 0) ?? 0;

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
          <h3 className="font-bold text-lg text-gray-900">실시간 예약</h3>
          <button onClick={onClose} aria-label="닫기" className="cursor-pointer">
            <i className="ri-close-line text-2xl text-gray-500"></i>
          </button>
        </div>

        {result ? (
          <div className="p-6 space-y-4 overflow-y-auto">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <p className="text-gray-700">예약이 완료되었습니다!</p>
              <p className="text-xl font-bold text-primary mt-2">
                {name}님 · 총 {result.length}건
              </p>
              <p className="text-sm text-gray-500 mt-1">{formatDateKorean(date)}</p>
            </div>
            <div className="space-y-2">
              {result.map((it) => (
                <div
                  key={it.reservationNo}
                  className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3 text-sm"
                >
                  <div>
                    <p className="font-bold text-gray-900">
                      {it.zoneLabel}
                      {it.hasTimeType ? ` · ${it.timeType}` : ''}
                    </p>
                    <p className="text-gray-500 text-xs mt-0.5">
                      자리 {it.cabanaNo}번 · 예약번호 {it.reservationNo}
                    </p>
                  </div>
                  <span className="font-bold text-gray-900">{won(it.price)}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between border-t pt-3">
              <span className="font-bold text-gray-900">합계</span>
              <span className="font-bold text-lg text-primary">{won(resultTotal)}</span>
            </div>
            {resultDeposit ? (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm">
                <p className="font-bold text-amber-900 mb-2">
                  예약금 {won(resultDeposit.total)}을 입금해주세요
                </p>
                <div className="bg-white rounded-lg px-3 py-2 space-y-0.5">
                  <p className="font-bold text-gray-900">
                    {resultDeposit.policy.bankName} {resultDeposit.policy.accountNo}
                  </p>
                  {resultDeposit.policy.holder && (
                    <p className="text-gray-600 text-xs">예금주 {resultDeposit.policy.holder}</p>
                  )}
                  <p className="text-gray-600 text-xs">
                    입금자명{' '}
                    <strong className="text-gray-900">{depositorName.trim() || name}</strong>
                  </p>
                </div>
                <p className="text-xs text-amber-800 mt-2 leading-relaxed whitespace-pre-line">
                  {resultDeposit.policy.guide ||
                    '입금이 확인되면 예약이 확정되고 안내 메시지를 보내드립니다.'}
                </p>
              </div>
            ) : (
              <p className="text-xs text-gray-500 text-center">
                위에 표시된 자리 번호로 배정되었습니다. 예약번호를 가지고 현장에서 결제해주세요.
              </p>
            )}
            <button
              onClick={onClose}
              className="w-full px-6 py-3 bg-primary text-white font-semibold !rounded-button hover:bg-opacity-90 transition-all cursor-pointer"
            >
              확인
            </button>
          </div>
        ) : showLookup ? (
          <LookupView onBack={() => setShowLookup(false)} />
        ) : (
          <>
            {/* 단계 표시 — 이미 지나온 단계는 눌러서 되돌아갈 수 있다. */}
            <div className="flex gap-1 px-4 md:px-6 pt-3 shrink-0">
              {STEPS.map((s) => (
                <button
                  key={s.no}
                  type="button"
                  onClick={() => goStep(s.no)}
                  className={`flex-1 min-w-0 px-1 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                    step === s.no
                      ? 'bg-primary text-white'
                      : step > s.no
                        ? 'bg-primary/10 text-primary'
                        : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  <span className="block truncate">
                    {s.no}. {s.label}
                  </span>
                </button>
              ))}
            </div>

            <div className="p-4 md:p-6 space-y-3 overflow-y-auto">
              {/* ---------- 1단계: 일자 조회 · 상품별 잔여 현황 ---------- */}
              {step === 1 && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      예약 일자
                    </label>
                    <input
                      type="date"
                      value={date}
                      min={today()}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div className="space-y-2 bg-blue-50 rounded-lg p-3 text-sm">
                    <p className="text-xs font-semibold text-gray-600">상품별 잔여 현황</p>
                    {groups.map((g) => (
                      <div key={g.zoneLabel} className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-gray-800 shrink-0">{g.zoneLabel}</span>
                        <span className="text-gray-600 text-right">
                          {g.items.map((p, i) => (
                            <span key={productKey(p)}>
                              {i > 0 && <span className="text-gray-300"> · </span>}
                              {p.hasTimeType ? `${p.timeType} ` : '잔여 '}
                              <strong className="text-gray-900">{remainingFor(p)}</strong>
                            </span>
                          ))}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">
                    날짜를 고르고 &lsquo;계속 진행&rsquo;을 눌러주세요. 날짜를 바꾸면 담은 상품은
                    초기화됩니다.
                  </p>
                </>
              )}

              {/* ---------- 2단계: 배치도 · 이용권 담기 · 인원 ---------- */}
              {step === 2 && (
                <>
                  {diagramUrls.filter(Boolean).length > 0 && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">
                        배치도 (이미지를 누르면 크게 볼 수 있어요)
                      </label>
                      <ImageCarousel
                        images={diagramUrls}
                        alt="평상&케노피 배치도"
                        className="bg-blue-50 rounded-lg overflow-hidden aspect-video"
                        imgClassName="w-full h-full object-contain"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      이용권 종류 (담은 후 여러 상품을 추가할 수 있어요)
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={selectedKey}
                        onChange={(e) => setSelectedKey(e.target.value)}
                        className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        {groups.map((g) => (
                          <optgroup key={g.zoneLabel} label={g.zoneLabel}>
                            {g.items.map((p) => {
                              const left = remainingFor(p);
                              return (
                                <option
                                  key={productKey(p)}
                                  value={productKey(p)}
                                  disabled={left <= 0}
                                >
                                  {p.zoneLabel}
                                  {p.hasTimeType ? ` · ${p.timeType}` : ''} · {won(p.price)} (잔여{' '}
                                  {left})
                                </option>
                              );
                            })}
                          </optgroup>
                        ))}
                      </select>
                      {selectedProduct?.hasTimeType && (
                        <input
                          type="number"
                          min={1}
                          max={guestPolicy.maxCount}
                          value={addGuestCount}
                          onChange={(e) =>
                            setAddGuestCount(
                              Math.max(
                                1,
                                Math.min(Number(e.target.value) || 1, guestPolicy.maxCount),
                              ),
                            )
                          }
                          title="인원수"
                          className="w-16 px-2 py-2 border border-gray-300 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      )}
                      <button
                        onClick={handleAdd}
                        disabled={!canAdd}
                        className="px-4 py-2 bg-primary text-white text-sm font-semibold !rounded-button hover:bg-opacity-90 transition-all disabled:opacity-40 cursor-pointer shrink-0"
                      >
                        담기
                      </button>
                    </div>
                    {selectedProduct?.hasTimeType && (
                      <p className="text-xs text-gray-500 mt-1">
                        기본 {guestPolicy.baseCount}명 포함, 초과 인원 1명당{' '}
                        {won(guestPolicy.extraFee)} 추가 (최대 {guestPolicy.maxCount}명)
                      </p>
                    )}
                  </div>
                  {/* 담기 직후 바로 보이도록 이용권 종류 아래에 담은 상품 목록을 둔다. */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      담은 상품 ({cart.length}건)
                    </label>
                    {cart.length === 0 ? (
                      <p className="text-sm text-gray-400 bg-gray-50 rounded-lg px-4 py-3 text-center">
                        위에서 상품을 선택하고 &lsquo;담기&rsquo;를 눌러주세요.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {cart.map((line) => (
                          <div
                            key={line.id}
                            className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 text-sm"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-900 truncate">
                                {line.zoneLabel}
                                {line.hasTimeType ? ` · ${line.timeType}` : ''}
                              </p>
                              <p className="text-xs text-gray-500">{won(linePrice(line))}</p>
                            </div>
                            {line.hasTimeType && (
                              <label className="flex items-center gap-1 text-xs text-gray-500 shrink-0">
                                <span>인원</span>
                                <input
                                  type="number"
                                  min={1}
                                  max={guestPolicy.maxCount}
                                  value={line.guestCount}
                                  onChange={(e) =>
                                    updateLineGuests(line.id, Number(e.target.value) || 1)
                                  }
                                  className="w-12 px-1 py-1 border border-gray-300 rounded text-center focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                              </label>
                            )}
                            <button
                              onClick={() => removeLine(line.id)}
                              aria-label="삭제"
                              className="text-gray-400 hover:text-red-600 cursor-pointer shrink-0"
                            >
                              <i className="ri-close-circle-line text-xl"></i>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* ---------- 3단계: 배치도를 보며 담은 상품별 자리 번호 선택 ---------- */}
              {step === 3 && (
                <>
                  {diagramUrls.filter(Boolean).length > 0 && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">
                        배치도 (이미지를 누르면 크게 볼 수 있어요)
                      </label>
                      <ImageCarousel
                        images={diagramUrls}
                        alt="평상&케노피 배치도"
                        className="bg-blue-50 rounded-lg overflow-hidden aspect-video"
                        imgClassName="w-full h-full object-contain"
                      />
                    </div>
                  )}

                  {numberedLines.length === 0 ? (
                    <p className="text-sm text-gray-400 bg-gray-50 rounded-lg px-4 py-6 text-center">
                      담으신 상품은 자리 번호를 지정하지 않습니다. 계속 진행해주세요.
                    </p>
                  ) : (
                    numberedLines.map((line) => {
                      const taken = takenNosForLine(line);
                      return (
                        <div key={line.id}>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">
                            {line.zoneLabel} · {line.timeType} 자리 번호
                          </label>
                          <div className="grid grid-cols-6 sm:grid-cols-8 gap-1.5">
                            <button
                              type="button"
                              onClick={() => setLineNo(line.id, 0)}
                              className={`col-span-2 px-2 py-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                                line.cabanaNo === 0
                                  ? 'bg-primary text-white border-primary'
                                  : 'bg-white text-gray-600 border-gray-300 hover:border-primary'
                              }`}
                            >
                              자동 배정
                            </button>
                            {Array.from({ length: line.slotCount }, (_, i) => i + 1).map((n) => {
                              const isTaken = taken.has(n);
                              return (
                                <button
                                  key={n}
                                  type="button"
                                  disabled={isTaken}
                                  onClick={() => setLineNo(line.id, n)}
                                  title={isTaken ? '이미 예약된 자리' : `${n}번 자리`}
                                  className={`px-1 py-2 text-xs font-bold rounded-lg border transition-all ${
                                    isTaken
                                      ? 'bg-gray-100 text-gray-300 border-gray-200 line-through cursor-not-allowed'
                                      : line.cabanaNo === n
                                        ? 'bg-primary text-white border-primary cursor-pointer'
                                        : 'bg-white text-gray-700 border-gray-300 hover:border-primary cursor-pointer'
                                  }`}
                                >
                                  {n}
                                </button>
                              );
                            })}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {line.cabanaNo > 0
                              ? `${line.zoneLabel} ${line.cabanaNo}번 자리로 예약됩니다.`
                              : '번호를 고르지 않으면 현장에서 빈 자리로 자동 배정됩니다.'}
                          </p>
                        </div>
                      );
                    })
                  )}
                </>
              )}

              {/* ---------- 4단계: 요약 · 예약자 정보 · 확정 ---------- */}
              {step === 4 && (
                <>
                  <div className="bg-blue-50 rounded-lg p-3 text-sm">
                    <p className="text-xs font-semibold text-gray-600 mb-2">
                      {formatDateKorean(date)} · 총 {cart.length}건
                    </p>
                    <div className="space-y-1">
                      {cart.map((line) => (
                        <div key={line.id} className="flex items-center justify-between gap-2">
                          <span className="text-gray-800 min-w-0 truncate">
                            {line.zoneLabel}
                            {line.hasTimeType ? ` · ${line.timeType}` : ''}
                            {line.cabanaNo > 0 ? (
                              <span className="text-primary font-semibold">
                                {' '}
                                · {line.cabanaNo}번
                              </span>
                            ) : (
                              <span className="text-gray-400"> · 자동 배정</span>
                            )}
                            {line.hasTimeType ? ` · ${line.guestCount}명` : ''}
                          </span>
                          <span className="font-semibold text-gray-900 shrink-0">
                            {won(linePrice(line))}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">
                        예약자 성함
                      </label>
                      <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        maxLength={50}
                        placeholder="홍길동"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">
                        연락처
                      </label>
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

                  <div className="flex items-center justify-between bg-white rounded-lg px-4 py-3 border border-gray-200">
                    <span className="text-sm text-gray-500">예상 결제 금액</span>
                    <span className="font-bold text-lg text-primary">{won(totalPrice)}</span>
                  </div>

                  {/* 자리를 지정한 항목이 있으면 노쇼 방지 예약금을 안내하고 입금자명을 받는다. */}
                  {depositPolicy && depositTotal > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-amber-900">
                          자리 지정 예약금 ({depositLines}자리)
                        </span>
                        <span className="font-bold text-amber-900">{won(depositTotal)}</span>
                      </div>
                      <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                        예약 후 안내되는 계좌로 입금해주시면 자리가 확정됩니다. 입금이 확인되면 안내
                        메시지를 보내드립니다.
                      </p>

                      {/* 예약금만 낼지, 이용요금 전액을 미리 낼지 선택 */}
                      <div className="flex gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => setIsFullPayment(false)}
                          className={`flex-1 px-3 py-2 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                            !isFullPayment
                              ? 'bg-amber-500 text-white border-amber-500'
                              : 'bg-white text-amber-800 border-amber-300 hover:border-amber-500'
                          }`}
                        >
                          예약금만 입금
                          <span className="block font-normal opacity-80">
                            {won(depositLines * (depositPolicy?.amount ?? 0))} · 잔액 현장 결제
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsFullPayment(true)}
                          className={`flex-1 px-3 py-2 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                            isFullPayment
                              ? 'bg-amber-500 text-white border-amber-500'
                              : 'bg-white text-amber-800 border-amber-300 hover:border-amber-500'
                          }`}
                        >
                          전액 결제
                          <span className="block font-normal opacity-80">
                            {won(totalPrice)} · 현장 결제 없음
                          </span>
                        </button>
                      </div>

                      <input
                        value={depositorName}
                        onChange={(e) => setDepositorName(e.target.value)}
                        placeholder={`입금자명 (비워두면 ${name.trim() || '예약자 성함'})`}
                        className="w-full mt-2 px-3 py-2 border border-amber-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                      />

                      <ul className="text-[11px] text-amber-800 mt-2 space-y-0.5 leading-relaxed">
                        <li>• 방문하시면 현장에서 결제하고 입금하신 예약금은 환불해 드립니다.</li>
                        <li>
                          • <strong>이용 당일 취소</strong>는 예약금을 환불해 드리지 않습니다.
                        </li>
                        <li>
                          • <strong>연락 없이 방문하지 않으신 경우(노쇼)</strong>에도 예약금은
                          환불되지 않습니다.
                        </li>
                      </ul>
                    </div>
                  )}

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
                </>
              )}

              {error && <p className="text-sm text-red-600 font-semibold">{error}</p>}
            </div>

            {/* 하단 고정 영역 — 단계 이동과 취소/조회/확정 버튼이 항상 보인다.
                단계 이동 줄은 회색 배경으로 구분해 아래 실행 버튼과 헷갈리지 않게 한다. */}
            <div className="border-t shrink-0 bg-white">
              <div className="flex gap-2 bg-gray-100 px-4 md:px-6 py-2.5">
                <button
                  onClick={() => goStep(step - 1)}
                  disabled={step === 1}
                  className="flex-1 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 font-semibold !rounded-button hover:bg-gray-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  이전
                </button>
                {/* 마지막 단계에서는 더 넘어갈 곳이 없으므로 숨긴다. */}
                {step < 4 && (
                  <button
                    onClick={() => goStep(step + 1)}
                    className="flex-1 px-4 py-2.5 bg-gray-900 text-white font-semibold !rounded-button hover:bg-opacity-90 transition-all cursor-pointer"
                  >
                    계속 진행
                  </button>
                )}
              </div>
              <div className="flex gap-2 px-4 md:px-6 py-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2.5 text-gray-600 text-sm font-semibold !rounded-button hover:bg-gray-100 transition-all cursor-pointer shrink-0"
                >
                  취소
                </button>
                <button
                  onClick={() => setShowLookup(true)}
                  className="px-4 py-2.5 border border-gray-300 text-gray-700 text-sm font-semibold !rounded-button hover:bg-gray-50 transition-all cursor-pointer shrink-0"
                >
                  예약조회하기
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={pending || cart.length === 0}
                  className="flex-1 min-w-0 px-4 py-2.5 bg-primary text-white font-semibold !rounded-button hover:bg-opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  {pending ? '예약 중...' : '예약 확정하기'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function LookupView({ onBack }: { onBack: () => void }) {
  const [phone, setPhone] = useState('');
  const [results, setResults] = useState<LookupReservation[] | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  // 취소 확인 팝업 대상. null이면 팝업이 닫힌 상태.
  const [cancelTarget, setCancelTarget] = useState<LookupReservation | null>(null);
  const [pending, startTransition] = useTransition();
  const [canceling, startCancel] = useTransition();
  const today = todaySeoul();

  function handleLookup() {
    setError('');
    setNotice('');
    setResults(null);
    if (!phone.trim()) {
      setError('연락처를 입력해주세요.');
      return;
    }
    startTransition(async () => {
      const res = (await lookupCabanaReservationsByPhone(phone.trim())) as LookupReservation[];
      if (res.length === 0) {
        setError('해당 연락처로 등록된 예약이 없습니다.');
      } else {
        setResults(res);
      }
    });
  }

  function handleCancel() {
    const target = cancelTarget;
    if (!target) return;
    setError('');
    setNotice('');
    startCancel(async () => {
      const res = await cancelCabanaReservationByPhone(target.id, phone.trim());
      setCancelTarget(null);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setResults((prev) => prev?.filter((r) => r.id !== target.id) ?? null);
      setNotice(`예약번호 ${target.reservation_no} 예약이 취소되었습니다.`);
    });
  }

  return (
    <div className="p-6 space-y-3 overflow-y-auto">
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">
          예약 시 입력한 연락처로 조회
        </label>
        <div className="flex gap-2">
          <input
            value={phone}
            onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
            type="tel"
            maxLength={13}
            placeholder="010-0000-0000"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            onClick={handleLookup}
            disabled={pending}
            className="px-4 py-2 bg-gray-900 text-white text-sm font-semibold !rounded-button hover:bg-opacity-90 transition-all disabled:opacity-50 cursor-pointer"
          >
            {pending ? '조회 중...' : '조회'}
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-red-600 font-semibold">{error}</p>}
      {notice && <p className="text-sm text-primary font-semibold">{notice}</p>}

      {results && (
        <div className="space-y-2">
          {results.map((r) => {
            const label = ZONE_LABELS[r.zone_type] ?? r.zone_type;
            const isSingle = r.zone_type === '썬배드';
            // 지난 예약이거나 이미 방문 확인된 건은 고객이 직접 취소할 수 없음.
            const cancelable = r.reservation_date >= today && !r.is_visited;
            return (
              <div key={r.id} className="bg-gray-50 rounded-lg p-3 text-sm">
                <p className="font-bold text-gray-900">
                  {formatDateKorean(r.reservation_date)} · {label}
                  {isSingle ? '' : ` ${r.time_type}`}
                </p>
                <p className="text-gray-600 mt-1">
                  예약자: {r.name} ({r.phone}) · {r.guest_count}명 · 순번 {r.cabana_no}번
                </p>
                <div className="flex items-end justify-between gap-2 mt-1">
                  <p className="text-gray-500 text-xs">예약번호 {r.reservation_no}</p>
                  {cancelable ? (
                    <button
                      onClick={() => setCancelTarget(r)}
                      className="px-3 py-1.5 border border-red-300 text-red-600 text-xs font-semibold !rounded-button hover:bg-red-50 transition-all cursor-pointer shrink-0"
                    >
                      예약취소
                    </button>
                  ) : (
                    <span className="text-gray-400 text-xs shrink-0">
                      {r.is_visited ? '방문 완료' : '이용 종료'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <button
        onClick={onBack}
        className="w-full mt-2 px-6 py-3 text-gray-600 font-semibold !rounded-button hover:bg-gray-100 transition-all cursor-pointer"
      >
        예약 화면으로 돌아가기
      </button>

      {cancelTarget && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-sm p-6">
            <p className="text-lg font-bold text-gray-900">예약을 취소할까요?</p>
            <div className="mt-3 bg-gray-50 rounded-lg p-3 text-sm">
              <p className="font-bold text-gray-900">
                {formatDateKorean(cancelTarget.reservation_date)} ·{' '}
                {ZONE_LABELS[cancelTarget.zone_type] ?? cancelTarget.zone_type}
                {cancelTarget.zone_type === '썬배드' ? '' : ` ${cancelTarget.time_type}`}
              </p>
              <p className="text-gray-500 text-xs mt-1">예약번호 {cancelTarget.reservation_no}</p>
            </div>
            <p className="text-sm text-gray-600 mt-3">
              취소한 예약은 되돌릴 수 없으며, 다시 이용하시려면 새로 예약해주세요.
            </p>
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setCancelTarget(null)}
                disabled={canceling}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-semibold !rounded-button hover:bg-gray-50 transition-all disabled:opacity-50 cursor-pointer"
              >
                돌아가기
              </button>
              <button
                onClick={handleCancel}
                disabled={canceling}
                className="flex-1 px-4 py-3 bg-red-600 text-white font-semibold !rounded-button hover:bg-opacity-90 transition-all disabled:opacity-50 cursor-pointer"
              >
                {canceling ? '취소 중...' : '예약취소'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const ZONE_LABELS: Record<string, string> = {
  케노피: '평상&케노피',
  그늘막평상: '그늘막평상',
  썬배드: '썬배드',
};
