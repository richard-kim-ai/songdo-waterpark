'use client';

import { useEffect, useState, useTransition } from 'react';
import { publicUrl } from '@/lib/images';
import { resizeImageFile } from '@/lib/admin/resizeImage';
import {
  listInquiries,
  createInquiry,
  viewInquiry,
  type InquiryListItem,
  type InquiryDetail,
} from '@/app/board/actions';

const MAX_IMAGES = 3;
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 원본 10MB 제한
const MAX_TOTAL_UPLOAD = 4 * 1024 * 1024; // 압축 후 전송 합계 안전 한도
const PAGE_SIZE = 10; // 페이지당 문의 수

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

// 현재 페이지 주변의 페이지 번호 목록(현재±2, 최대 5개)을 만든다.
function pageNumbers(current: number, total: number, span = 2) {
  let start = Math.max(1, current - span);
  const end = Math.min(total, start + span * 2);
  start = Math.max(1, end - span * 2);
  const arr: number[] = [];
  for (let i = start; i <= end; i++) arr.push(i);
  return arr;
}

// 목록·미확인 상태에서는 제목 앞 3글자만 보이고 나머지는 가려서 표시
function maskTitle(title: string) {
  if (title.length <= 3) return title;
  return `${title.slice(0, 3)}***`;
}

export default function CustomerBoard({
  sectionTitle,
  sectionSubtitle,
}: {
  sectionTitle: string;
  sectionSubtitle: string;
}) {
  const [posts, setPosts] = useState<InquiryListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWrite, setShowWrite] = useState(false);
  const [viewTarget, setViewTarget] = useState<InquiryListItem | null>(null);
  const [page, setPage] = useState(1);

  async function refresh() {
    setLoading(true);
    setPosts(await listInquiries());
    setPage(1);
    setLoading(false);
  }

  const totalPages = Math.max(1, Math.ceil(posts.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagePosts = posts.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  useEffect(() => {
    refresh();
  }, []);

  return (
    <section id="board" className="py-12 md:py-20 bg-gradient-to-b from-white to-blue-50/30">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-4">{sectionTitle}</h2>
          <p className="text-base md:text-lg text-gray-600">{sectionSubtitle}</p>
        </div>

        <div className="flex justify-end mb-4">
          <button
            onClick={() => setShowWrite(true)}
            className="px-6 py-3 bg-primary text-white font-semibold !rounded-button hover:bg-opacity-90 transition-all whitespace-nowrap cursor-pointer"
          >
            <i className="ri-pencil-line mr-1"></i> 문의 작성
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="grid grid-cols-[6rem_1fr_5rem_4rem] sm:grid-cols-[8rem_1fr_6rem_5rem] gap-3 px-4 sm:px-6 py-4 bg-gray-50 border-b text-sm font-bold text-gray-600">
            <span>아이디</span>
            <span>제목</span>
            <span className="text-center">작성일</span>
            <span className="text-center">상태</span>
          </div>

          {loading ? (
            <p className="px-6 py-10 text-center text-gray-400">불러오는 중...</p>
          ) : posts.length === 0 ? (
            <p className="px-6 py-10 text-center text-gray-400">
              등록된 문의가 없습니다. 첫 문의를 남겨보세요.
            </p>
          ) : (
            pagePosts.map((p) => (
              <button
                key={p.id}
                onClick={() => setViewTarget(p)}
                className="w-full grid grid-cols-[6rem_1fr_5rem_4rem] sm:grid-cols-[8rem_1fr_6rem_5rem] gap-3 px-4 sm:px-6 py-4 border-b last:border-b-0 items-center text-left hover:bg-blue-50/40 transition-colors cursor-pointer"
              >
                <span className="font-medium text-gray-900 truncate">{p.author_id}</span>
                <span className="flex items-center gap-2 text-gray-700 min-w-0">
                  <i className="ri-lock-line text-gray-400 shrink-0"></i>
                  <span className="truncate">{maskTitle(p.title)}</span>
                </span>
                <span className="text-center text-sm text-gray-500">{formatDate(p.created_at)}</span>
                <span className="text-center">
                  {p.is_answered ? (
                    <span className="inline-block px-2 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                      답변완료
                    </span>
                  ) : (
                    <span className="inline-block px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">
                      답변대기
                    </span>
                  )}
                </span>
              </button>
            ))
          )}
        </div>

        {!loading && totalPages > 1 && (
          <div className="flex justify-center items-center gap-1 mt-6">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              aria-label="이전 페이지"
              className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer disabled:cursor-default"
            >
              <i className="ri-arrow-left-s-line text-xl"></i>
            </button>
            {pageNumbers(safePage, totalPages).map((n) => (
              <button
                key={n}
                onClick={() => setPage(n)}
                className={`min-w-9 h-9 px-2 rounded-lg text-sm font-semibold cursor-pointer transition-colors ${
                  n === safePage ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {n}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              aria-label="다음 페이지"
              className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer disabled:cursor-default"
            >
              <i className="ri-arrow-right-s-line text-xl"></i>
            </button>
          </div>
        )}
      </div>

      {showWrite && (
        <WriteModal
          onClose={() => setShowWrite(false)}
          onDone={() => {
            setShowWrite(false);
            refresh();
          }}
        />
      )}
      {viewTarget && <ViewModal target={viewTarget} onClose={() => setViewTarget(null)} />}
    </section>
  );
}

function WriteModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [authorId, setAuthorId] = useState('');
  const [password, setPassword] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    setError('');
    const selected = Array.from(e.target.files ?? []);
    e.target.value = ''; // 같은 파일 재선택 허용
    const merged = [...images];
    for (const f of selected) {
      if (merged.length >= MAX_IMAGES) {
        setError('이미지는 최대 3장까지 첨부할 수 있습니다.');
        break;
      }
      if (f.size > MAX_FILE_BYTES) {
        setError('이미지는 장당 10MB 이하만 업로드할 수 있습니다.');
        continue;
      }
      merged.push(f);
    }
    setImages(merged.slice(0, MAX_IMAGES));
  }

  function removeImage(idx: number) {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleSubmit() {
    setError('');
    startTransition(async () => {
      // 기존 이미지 업로드와 동일한 압축(리사이즈→WebP) 적용
      const compressed: File[] = [];
      for (const f of images) {
        compressed.push(await resizeImageFile(f));
      }
      const total = compressed.reduce((sum, f) => sum + f.size, 0);
      if (total > MAX_TOTAL_UPLOAD) {
        setError('첨부 이미지 용량이 큽니다. 사진 수를 줄이거나 더 작은 이미지를 사용해주세요.');
        return;
      }

      const fd = new FormData();
      fd.set('authorId', authorId);
      fd.set('password', password);
      fd.set('title', title);
      fd.set('content', content);
      compressed.forEach((f) => fd.append('images', f));

      const res = await createInquiry(fd);
      if (res.ok) {
        onDone();
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
          <h3 className="font-bold text-lg text-gray-900">문의 작성 (비밀글)</h3>
          <button onClick={onClose} aria-label="닫기" className="cursor-pointer">
            <i className="ri-close-line text-2xl text-gray-500"></i>
          </button>
        </div>
        <div className="p-6 space-y-3 overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">아이디</label>
              <input
                value={authorId}
                onChange={(e) => setAuthorId(e.target.value.replace(/[^A-Za-z0-9]/g, ''))}
                maxLength={20}
                placeholder="영문+숫자"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="text-xs text-gray-400 mt-1">영문과 숫자만 사용 가능</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">비밀번호</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                maxLength={100}
                placeholder="답변 확인용 (4자 이상)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">제목</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">내용</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              maxLength={2000}
              placeholder={
                '예) 케노피 예약 관련 문의드립니다. 8월 5일 방문 예정이며 인원은 성인 4명입니다. 예약 가능한지 확인 부탁드립니다.\n\n※ 별도로 회신(문자·이메일)을 받고 싶으시면 핸드폰 번호 또는 이메일 주소를 함께 남겨주세요.'
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-gray-300"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              사진 첨부 (최대 3장 · 장당 10MB 이하)
            </label>
            {images.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {images.map((f, i) => (
                  <div key={i} className="relative w-20 h-20">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={URL.createObjectURL(f)}
                      alt={`첨부 ${i + 1}`}
                      className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      aria-label="삭제"
                      className="absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center bg-gray-800 text-white rounded-full text-xs cursor-pointer"
                    >
                      <i className="ri-close-line"></i>
                    </button>
                  </div>
                ))}
              </div>
            )}
            {images.length < MAX_IMAGES && (
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFiles}
                className="block text-sm text-gray-600"
              />
            )}
          </div>
          <p className="text-xs text-gray-500">
            내용·사진은 비공개이며, 목록에는 아이디와 제목만 표시됩니다. 답변은 작성한 아이디와
            비밀번호로 확인할 수 있으니 비밀번호를 기억해주세요.
          </p>
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
            {pending ? '등록 중...' : '등록'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ViewModal({ target, onClose }: { target: InquiryListItem; onClose: () => void }) {
  const [password, setPassword] = useState('');
  const [detail, setDetail] = useState<InquiryDetail | null>(null);
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();

  function handleVerify() {
    setError('');
    startTransition(async () => {
      const res = await viewInquiry(target.id, password);
      if (res.ok) {
        setDetail(res.data);
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
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="font-bold text-lg text-gray-900 truncate">
            <i className="ri-lock-line mr-1 text-gray-400"></i>
            {maskTitle(target.title)}
          </h3>
          <button onClick={onClose} aria-label="닫기" className="cursor-pointer shrink-0">
            <i className="ri-close-line text-2xl text-gray-500"></i>
          </button>
        </div>

        {!detail ? (
          <div className="p-6 space-y-3">
            <p className="text-sm text-gray-600">
              비밀글입니다. 작성 시 설정한 비밀번호를 입력하면 내용과 답변을 확인할 수 있습니다.
            </p>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
              placeholder="비밀번호"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {error && <p className="text-sm text-red-600 font-semibold">{error}</p>}
            <button
              onClick={handleVerify}
              disabled={pending}
              className="w-full px-6 py-2 bg-primary text-white font-semibold !rounded-button hover:bg-opacity-90 transition-all disabled:opacity-50 cursor-pointer"
            >
              {pending ? '확인 중...' : '확인'}
            </button>
          </div>
        ) : (
          <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            <div>
              <p className="text-xs text-gray-400 mb-1">
                {detail.author_id} · {formatDate(detail.created_at)}
              </p>
              <h4 className="text-lg font-bold text-gray-900">{detail.title}</h4>
              <p className="text-gray-700 whitespace-pre-wrap mt-2">{detail.content}</p>
            </div>
            {detail.image_paths.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {detail.image_paths.map((path, i) => (
                  <a key={i} href={publicUrl(path)} target="_blank" rel="noopener noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={publicUrl(path)}
                      alt={`첨부 ${i + 1}`}
                      loading="lazy"
                      decoding="async"
                      className="w-full aspect-square object-cover rounded-lg border border-gray-200 hover:opacity-90 transition-opacity"
                    />
                  </a>
                ))}
              </div>
            )}
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm font-bold text-primary mb-2">
                <i className="ri-customer-service-2-line mr-1"></i> 관리자 답변
              </p>
              {detail.reply ? (
                <p className="text-gray-700 whitespace-pre-wrap">{detail.reply}</p>
              ) : (
                <p className="text-gray-400">아직 답변이 등록되지 않았습니다.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
