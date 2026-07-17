import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// ⚠️ 본인의 Supabase 프로젝트 URL과 Anon Key로 변경하세요.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://nhduqqzplmglnfhuxbne.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5oZHVxcXpwbG1nbG5maHV4Ym5lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMyNTcwMDksImV4cCI6MjA5ODgzMzAwOX0.AAb4OG77vQZHpcibKmxmUMZo7i2xftcLRpoLdfZj6JQ";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default function CabanaManagement() {
  const [activeTab, setActiveTab] = useState('user'); // 'user' 또는 'admin'
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [reservations, setReservations] = useState([]);
  
  // 폼 상태 관리
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    guestCount: 1,
    timeType: '주간',
    isCamping: false,
    hasAdmission: false
  });

  // 어드민 상태 관리
  const [selectedCabana, setSelectedCabana] = useState(null);
  const [editingReservation, setEditingReservation] = useState(null);

  // 데이터 로딩
  useEffect(() => {
    fetchReservations();
  }, [selectedDate]);

  const fetchReservations = async () => {
    const { data, error } = await supabase
      .from('cabana_reservations')
      .select('*')
      .eq('reservation_date', selectedDate);
    
    if (error) console.error('데이터 로드 실패:', error);
    else setReservations(data || []);
  };

  // 캠핑장 체크 시 입장권 자동 체크 로직 반영
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;
    
    setFormData(prev => {
      const updated = { ...prev, [name]: val };
      if (name === 'isCamping' && checked) {
        updated.hasAdmission = true; // 캠핑장 고객이면 입장권 자동 무료 지급
      }
      return updated;
    });
  };

  // 랜덤 예약번호 생성기 (R + YYMMDD + 4자리 랜덤익명값)
  const generateReservationNo = (dateStr) => {
    const cleanDate = dateStr.replace(/-/g, '').substring(2);
    const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `R${cleanDate}${randomStr}`;
  };

  // [사용자] 예약 제출 프로세스
  const handleConfirmReservation = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) return alert('예약자 이름과 연락처를 입력해주세요.');

    // 해당 날짜에 비어있는 카바나 번호 자동 배정 (1~60 중 해당 타임에 예약 없는 곳)
    const bookedCabanas = reservations
      .filter(res => {
        if (formData.timeType === '종일') return true;
        return res.timeType === formData.timeType || res.timeType === '종일';
      })
      .map(res => res.cabana_no);

    let assignedCabana = null;
    for (let i = 1; i <= 60; i++) {
      if (!bookedCabanas.includes(i)) {
        assignedCabana = i;
        break;
      }
    }

    if (!assignedCabana) return alert('선택하신 날짜의 해당 타임 카바나가 모두 매진되었습니다.');

    const resNo = generateReservationNo(selectedDate);

    const { error } = await supabase
      .from('cabana_reservations')
      .insert([{
        reservation_no: resNo,
        reservation_date: selectedDate,
        cabana_no: assignedCabana,
        time_type: formData.timeType,
        name: formData.name,
        phone: formData.phone,
        guest_count: parseInt(formData.guestCount),
        is_camping: formData.isCamping,
        has_admission: formData.hasAdmission
      }]);

    if (error) {
      alert('예약 처리 중 오류가 발생했습니다: ' + error.message);
    } else {
      alert(`예약이 완료되었습니다!\n카바나 번호: ${assignedCabana}번\n예약번호: ${resNo}`);
      setFormData({ name: '', phone: '', guestCount: 1, timeType: '주간', isCamping: false, hasAdmission: false });
      fetchReservations();
    }
  };

  // [관리자] 예약 수정 내역 저장
  const handleUpdateReservation = async () => {
    if (!editingReservation) return;

    const { error } = await supabase
      .from('cabana_reservations')
      .update({
        name: editingReservation.name,
        phone: editingReservation.phone,
        guest_count: parseInt(editingReservation.guest_count),
        time_type: editingReservation.time_type,
        is_camping: editingReservation.is_camping,
        has_admission: editingReservation.is_camping ? true : editingReservation.has_admission
      })
      .eq('id', editingReservation.id);

    if (error) {
      alert('수정 실패: ' + error.message);
    } else {
      alert('예약 정보가 수정되었습니다.');
      setEditingReservation(null);
      setSelectedCabana(null);
      fetchReservations();
    }
  };

  // [관리자] 예약 취소 (삭제) 프로세스
  const handleCancelReservation = async (id) => {
    if (!window.confirm('정말로 이 예약을 취소하시겠습니까? 취소 후 복구는 불가능합니다.')) return;

    const { error } = await supabase
      .from('cabana_reservations')
      .delete()
      .eq('id', id);

    if (error) {
      alert('취소 처리 실패: ' + error.message);
    } else {
      alert('예약이 성공적으로 취소되고 카바나 자리가 인벤토리에 환원되었습니다.');
      setEditingReservation(null);
      setSelectedCabana(null);
      fetchReservations();
    }
  };

  // 남은 수량 통계 계산 로직
  const dayBookedCount = reservations.filter(r => r.time_type === '주간' || r.time_type === '종일').length;
  const nightBookedCount = reservations.filter(r => r.time_type === '야간' || r.time_type === '종일').length;
  
  const dayLeft = Math.max(0, 60 - dayBookedCount);
  const nightLeft = Math.max(0, 60 - nightBookedCount);
  const fullDayLeft = Math.min(dayLeft, nightLeft);

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button onClick={() => setActiveTab('user')} style={{ padding: '10px 20px', backgroundColor: activeTab === 'user' ? '#0070f3' : '#ccc', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>사용자 예약 페이지</button>
        <button onClick={() => setActiveTab('admin')} style={{ padding: '10px 20px', backgroundColor: activeTab === 'admin' ? '#0070f3' : '#ccc', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>어드민 관리 모듈</button>
      </div>

      <div style={{ marginBottom: '20px', padding: '15px', background: '#f5f5f5', borderRadius: '8px' }}>
        <label style={{ fontWeight: 'bold', marginRight: '10px' }}>조회/예약 일자 선택:</label>
        <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} style={{ padding: '5px 10px', borderRadius: '4px', border: '1px solid #ccc' }} />
      </div>

      {activeTab === 'user' && (
        <div style={{ background: '#fff', border: '1px solid #e0e0e0', padding: '25px', borderRadius: '8px' }}>
          <h2 style={{ marginTop: 0, borderBottom: '2px solid #0070f3', paddingBottom: '10px' }}>송도 워터파크 카바나 예약 신청</h2>
          
          <div style={{ display: 'flex', gap: '20px', margin: '20px 0', padding: '15px', background: '#ebf5ff', borderRadius: '6px' }}>
            <div>☀️ 주간 타임 잔여: <strong>{dayLeft}개</strong> / 60개</div>
            <div>🌙 야간 타임 잔여: <strong>{nightLeft}개</strong> / 60개</div>
            <div>🎟️ 종일권 가능 수량: <strong style={{ color: fullDayLeft === 0 ? 'red' : 'inherit' }}>{fullDayLeft}개</strong></div>
          </div>

          <form onSubmit={handleConfirmReservation} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>티켓 종류 선택</label>
              <select name="timeType" value={formData.timeType} onChange={handleInputChange} style={{ width: '100%', padding: '10px', borderRadius: '4px' }}>
                <option value="주간" disabled={dayLeft <= 0}>주간 타임 이용권 (남은 수량: {dayLeft}개)</option>
                <option value="야간" disabled={nightLeft <= 0}>야간 타임 이용권 (남은 수량: {nightLeft}개)</option>
                <option value="종일" disabled={fullDayLeft <= 0}>종일 패키지이용권 (남은 수량: {fullDayLeft}개)</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>예약자 성함</label>
                <input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="홍길동" style={{ width: '90%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>연락처</label>
                <input type="text" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="010-XXXX-XXXX" style={{ width: '90%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>입장 및 투숙 조건 체크</label>
              <div style={{ display: 'flex', gap: '20px', marginTop: '5px' }}>
                <label>
                  <input type="checkbox" name="isCamping" checked={formData.isCamping} onChange={handleInputChange} /> 캠핑장 이용 고객 (선택 시 입장권 무료 자동 부여)
                </label>
                <label>
                  <input type="checkbox" name="hasAdmission" checked={formData.hasAdmission} onChange={handleInputChange} disabled={formData.isCamping} /> 워터파크 입장권 별도 상시 구매완료 유무
                </label>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>이용 인원수</label>
              <input type="number" name="guestCount" min="1" value={formData.guestCount} onChange={handleInputChange} style={{ width: '60px', padding: '8px', borderRadius: '4px' }} /> 명
            </div>

            <button type="submit" style={{ width: '100%', padding: '15px', background: '#0070f3', color: '#fff', fontSize: '16px', fontWeight: 'bold', border: 'none', borderRadius: '5px', cursor: 'pointer', marginTop: '10px' }}>카바나 실시간 예약 확정하기</button>
          </form>
        </div>
      )}

      {activeTab === 'admin' && (
        <div>
          <h2 style={{ marginTop: 0 }}>실시간 카바나 배치 배정 현황판 (10 × 6 배열)</h2>
          <p style={{ fontSize: '13px', color: '#666' }}>카바나 아이콘 번호를 누르시면 슬롯별 세부 예약증 정보 확인 및 원격 예약 수정·강제 취소가 가능합니다.</p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: '10px', margin: '20px 0' }}>
            {Array.from({ length: 60 }, (_, i) => {
              const cabanaNo = i + 1;
              const matches = reservations.filter(r => r.cabana_no === cabanaNo);
              const isFull = matches.some(r => r.time_type === '종일') || matches.length >= 2;
              const isPart = matches.length === 1 && matches[0].time_type !== '종일';

              let bgColor = '#e0e0e0';
              if (isFull) bgColor = '#ff4d4f';
              else if (isPart) bgColor = '#ffc069';

              return (
                <button
                  key={cabanaNo}
                  onClick={() => {
                    setSelectedCabana(cabanaNo);
                    setEditingReservation(null);
                  }}
                  style={{
                    height: '55px',
                    backgroundColor: bgColor,
                    color: isFull ? '#fff' : '#000',
                    fontWeight: 'bold',
                    border: selectedCabana === cabanaNo ? '3px solid #000' : '1px solid #ccc',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  #{cabanaNo}
                </button>
              );
            })}
          </div>

          {selectedCabana && (
            <div style={{ marginTop: '20px', padding: '20px', border: '2px solid #333', borderRadius: '8px', background: '#fafafa' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>🚪 {selectedCabana}번 카바나 상세 스케줄러 정보</h3>
                <button onClick={() => setSelectedCabana(null)} style={{ background: '#ccc', border: 'none', padding: '5px 10px', cursor: 'pointer' }}>닫기</button>
              </div>

              {['주간', '야간', '종일'].map(slot => {
                const matchedRes = reservations.find(r => r.cabana_no === selectedCabana && (r.time_type === slot || r.time_type === '종일'));
                
                return (
                  <div key={slot} style={{ padding: '12px', borderBottom: '1px solid #ddd', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontWeight: 'bold', marginRight: '15px' }}>[{slot}]</span>
                      {matchedRes ? (
                        <span>
                          고객명: <strong>{matchedRes.name}</strong> ({matchedRes.phone}) | 
                          <span style={{ color: '#0070f3', marginLeft: '5px', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setEditingReservation({ ...matchedRes })}>
                             예약번호: {matchedRes.reservation_no}
                          </span>
                        </span>
                      ) : (
                        <span style={{ color: '#999' }}>예약 없음 (공석)</span>
                      )}
                    </div>
                  </div>
                );
              })}

              {editingReservation && (
                <div style={{ marginTop: '20px', padding: '15px', background: '#fff', border: '1px solid #40a9ff', borderRadius: '6px' }}>
                  <h4>⚙️ 예약 데이터 현장 관리 및 원격 제어 수정</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                    <label>고객성함: <input type="text" value={editingReservation.name} onChange={e => setEditingReservation({...editingReservation, name: e.target.value})} style={{ width: '100%', padding: '5px' }} /></label>
                    <label>연락처: <input type="text" value={editingReservation.phone} onChange={e => setEditingReservation({...editingReservation, phone: e.target.value})} style={{ width: '100%', padding: '5px' }} /></label>
                    <label>인원수: <input type="number" value={editingReservation.guest_count} onChange={e => setEditingReservation({...editingReservation, guest_count: e.target.value})} style={{ width: '100%', padding: '5px' }} /></label>
                    <label>타임형태: 
                      <select value={editingReservation.time_type} onChange={e => setEditingReservation({...editingReservation, time_type: e.target.value})} style={{ width: '100%', padding: '5px' }}>
                        <option value="주간">주간</option>
                        <option value="야간">야간</option>
                        <option value="종일">종일</option>
                      </select>
                    </label>
                  </div>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ marginRight: '15px' }}>
                      <input type="checkbox" checked={editingReservation.is_camping} onChange={e => setEditingReservation({...editingReservation, is_camping: e.target.checked})} /> 캠핑객 소속 유무
                    </label>
                    <label>
                      <input type="checkbox" checked={editingReservation.has_admission || editingReservation.is_camping} disabled={editingReservation.is_camping} onChange={e => setEditingReservation({...editingReservation, has_admission: e.target.checked})} /> 입장권 지급/확인 유무
                    </label>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={handleUpdateReservation} style={{ padding: '8px 15px', background: '#52c41a', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>변경내역 반영 저장</button>
                    <button onClick={() => handleCancelReservation(editingReservation.id)} style={{ padding: '8px 15px', background: '#ff4d4f', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>❌ 예약 전체 취소</button>
                    <button onClick={() => setEditingReservation(null)} style={{ padding: '8px 15px', background: '#ccc', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>수정 취소</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
