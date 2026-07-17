'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { hashPassword, verifyPassword } from '@/lib/inquiries/password';

export type InquiryListItem = {
  id: string;
  author_id: string;
  created_at: string;
  is_answered: boolean;
};

// 공개 목록: 게시자 아이디·작성일·답변여부만 반환 (제목/내용/답변 미노출)
export async function listInquiries(): Promise<InquiryListItem[]> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('inquiries')
      .select('id, author_id, created_at, reply')
      .order('created_at', { ascending: false })
      .limit(200);

    if (error || !data) return [];
    return data.map((r) => ({
      id: r.id,
      author_id: r.author_id,
      created_at: r.created_at,
      is_answered: !!r.reply,
    }));
  } catch {
    return [];
  }
}

export async function createInquiry(input: {
  authorId: string;
  password: string;
  title: string;
  content: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const authorId = (input.authorId ?? '').trim();
  const password = input.password ?? '';
  const title = (input.title ?? '').trim();
  const content = (input.content ?? '').trim();

  if (!authorId || authorId.length > 20) return { ok: false, error: '아이디는 1~20자로 입력해주세요.' };
  if (password.length < 4 || password.length > 100)
    return { ok: false, error: '비밀번호는 4자 이상 입력해주세요.' };
  if (!title || title.length > 100) return { ok: false, error: '제목은 1~100자로 입력해주세요.' };
  if (!content || content.length > 2000)
    return { ok: false, error: '내용은 1~2000자로 입력해주세요.' };

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from('inquiries').insert({
      author_id: authorId,
      password_hash: hashPassword(password),
      title,
      content,
    });
    if (error) return { ok: false, error: '등록 중 오류가 발생했습니다.' };

    revalidatePath('/');
    revalidatePath('/admin/inquiries');
    return { ok: true };
  } catch {
    return { ok: false, error: '등록 중 오류가 발생했습니다.' };
  }
}

export type InquiryDetail = {
  author_id: string;
  title: string;
  content: string;
  reply: string | null;
  replied_at: string | null;
  created_at: string;
};

// 작성자 본인 열람: 게시글 id + 비밀번호가 일치할 때만 상세(제목/내용/답변) 반환
export async function viewInquiry(
  id: string,
  password: string
): Promise<{ ok: true; data: InquiryDetail } | { ok: false; error: string }> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('inquiries')
      .select('author_id, password_hash, title, content, reply, replied_at, created_at')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) return { ok: false, error: '게시글을 찾을 수 없습니다.' };
    if (!verifyPassword(password, data.password_hash))
      return { ok: false, error: '비밀번호가 일치하지 않습니다.' };

    return {
      ok: true,
      data: {
        author_id: data.author_id,
        title: data.title,
        content: data.content,
        reply: data.reply,
        replied_at: data.replied_at,
        created_at: data.created_at,
      },
    };
  } catch {
    return { ok: false, error: '조회 중 오류가 발생했습니다.' };
  }
}
