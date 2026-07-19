'use client';

import { useState, useTransition } from 'react';
import {
  listAdminUsers,
  createRestrictedAdmin,
  updateAdminPermissions,
  deleteAdminUser,
} from '@/app/admin/actions';
import { ADMIN_PAGES } from '@/lib/admin/pages';

type AdminUser = {
  userId: string;
  email: string;
  isSuperAdmin: boolean;
  permissions: string[];
  createdAt: string;
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

export default function UserManager({
  initialUsers,
  currentUserId,
}: {
  initialUsers: AdminUser[];
  currentUserId: string;
}) {
  const [users, setUsers] = useState(initialUsers);
  const [showCreate, setShowCreate] = useState(false);

  function refresh() {
    listAdminUsers().then(setUsers);
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowCreate(true)}
          className="px-6 py-3 bg-primary text-white font-semibold !rounded-button hover:bg-opacity-90 transition-all cursor-pointer"
        >
          <i className="ri-user-add-line mr-1"></i> 관리자 등록
        </button>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="grid grid-cols-[1fr_7rem_1fr_6rem] gap-3 px-6 py-3 bg-gray-50 border-b text-xs font-bold text-gray-500">
          <span>이메일</span>
          <span className="text-center">등급</span>
          <span>관리 가능 항목</span>
          <span className="text-center">관리</span>
        </div>
        {users.map((u) => (
          <UserRow
            key={u.userId}
            user={u}
            isSelf={u.userId === currentUserId}
            onChanged={refresh}
          />
        ))}
        {users.length === 0 && (
          <p className="px-6 py-10 text-center text-gray-400">등록된 관리자가 없습니다.</p>
        )}
      </div>

      {showCreate && (
        <CreateModal
          onClose={() => setShowCreate(false)}
          onDone={() => {
            setShowCreate(false);
            refresh();
          }}
        />
      )}
    </div>
  );
}

function UserRow({
  user,
  isSelf,
  onChanged,
}: {
  user: AdminUser;
  isSelf: boolean;
  onChanged: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [permissions, setPermissions] = useState(user.permissions);
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();

  function toggle(key: string) {
    setPermissions((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
    );
  }

  function handleSave() {
    setError('');
    startTransition(async () => {
      try {
        await updateAdminPermissions(user.userId, permissions);
        setEditing(false);
        onChanged();
      } catch (err) {
        setError(err instanceof Error ? err.message : '저장 중 오류가 발생했습니다.');
      }
    });
  }

  function handleDelete() {
    if (!confirm(`${user.email} 계정을 삭제할까요? 삭제 후 복구는 불가능합니다.`)) return;
    startTransition(async () => {
      try {
        await deleteAdminUser(user.userId);
        onChanged();
      } catch (err) {
        setError(err instanceof Error ? err.message : '삭제 중 오류가 발생했습니다.');
      }
    });
  }

  return (
    <div className="border-b last:border-b-0">
      <div className="grid grid-cols-[1fr_7rem_1fr_6rem] gap-3 px-6 py-4 items-center">
        <span className="min-w-0">
          <span className="font-medium text-gray-900 truncate block">
            {user.email}
            {isSelf && <span className="ml-2 text-xs text-gray-400">(나)</span>}
          </span>
          <span className="text-xs text-gray-400">{formatDate(user.createdAt)} 등록</span>
        </span>
        <span className="text-center">
          {user.isSuperAdmin ? (
            <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">
              최고 관리자
            </span>
          ) : (
            <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">
              제한된 관리자
            </span>
          )}
        </span>
        <span className="text-sm text-gray-600">
          {user.isSuperAdmin
            ? '전체 메뉴'
            : ADMIN_PAGES.filter((p) => user.permissions.includes(p.key))
                .map((p) => p.label)
                .join(', ') || '없음'}
        </span>
        <span className="flex items-center justify-center gap-2">
          {!user.isSuperAdmin && (
            <>
              <button
                onClick={() => setEditing((v) => !v)}
                className="text-gray-400 hover:text-primary cursor-pointer"
                aria-label="권한 수정"
              >
                <i className="ri-edit-2-line text-lg"></i>
              </button>
              <button
                onClick={handleDelete}
                disabled={pending}
                className="text-gray-400 hover:text-red-600 cursor-pointer disabled:opacity-50"
                aria-label="삭제"
              >
                <i className="ri-delete-bin-line text-lg"></i>
              </button>
            </>
          )}
        </span>
      </div>

      {editing && (
        <div className="px-6 pb-5 -mt-1">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs font-semibold text-gray-600 mb-2">관리 가능 항목 선택</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
              {ADMIN_PAGES.map((p) => (
                <label key={p.key} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={permissions.includes(p.key)}
                    onChange={() => toggle(p.key)}
                  />
                  {p.label}
                </label>
              ))}
            </div>
            {error && <p className="text-sm text-red-600 font-semibold mb-2">{error}</p>}
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={pending}
                className="px-5 py-2 bg-primary text-white text-sm font-semibold !rounded-button hover:bg-opacity-90 transition-all disabled:opacity-50 cursor-pointer"
              >
                {pending ? '저장 중...' : '저장'}
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setPermissions(user.permissions);
                  setError('');
                }}
                className="px-5 py-2 text-gray-600 text-sm font-semibold !rounded-button hover:bg-gray-100 transition-all cursor-pointer"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CreateModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [permissions, setPermissions] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();

  function toggle(key: string) {
    setPermissions((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
    );
  }

  function handleSubmit() {
    setError('');
    startTransition(async () => {
      try {
        await createRestrictedAdmin(email, password, permissions);
        onDone();
      } catch (err) {
        setError(err instanceof Error ? err.message : '등록 중 오류가 발생했습니다.');
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
          <h3 className="font-bold text-lg text-gray-900">관리자 등록</h3>
          <button onClick={onClose} aria-label="닫기" className="cursor-pointer">
            <i className="ri-close-line text-2xl text-gray-500"></i>
          </button>
        </div>
        <div className="p-6 space-y-3 overflow-y-auto">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">이메일</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="staff@example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="6자 이상"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">
              관리 가능 항목 선택
            </label>
            <div className="grid grid-cols-2 gap-2">
              {ADMIN_PAGES.map((p) => (
                <label key={p.key} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={permissions.includes(p.key)}
                    onChange={() => toggle(p.key)}
                  />
                  {p.label}
                </label>
              ))}
            </div>
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
            {pending ? '등록 중...' : '등록'}
          </button>
        </div>
      </div>
    </div>
  );
}
