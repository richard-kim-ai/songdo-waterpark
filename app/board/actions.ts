'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { uploadImage } from '@/lib/admin/storage';
import { hashPassword, verifyPassword } from '@/lib/inquiries/password';

const MAX_IMAGES = 3;

export type InquiryListItem = {
  id: string;
  author_id: string;
  title: string;
  created_at: string;
  is_answered: boolean;
};

// 공개 목록: 아이디·제목·작성일·답변여부만 반환 (내용/답변/비밀번호 미노출)
export async function listInquiries(): Promise<InquiryListItem[]> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('inquiries')
      .select('id, author_id, title, created_at, reply')
      .order('created_at', { ascending: false })
      .limit(200);

    if (error || !data) return [];
    return data.map((r) => ({
      id: r.id,
      author_id: r.author_id,
      title: r.title,
      created_at: r.created_at,
      is_answered: !!r.reply,
    }));
  } catch {
    return [];
  }
}

export async function createInquiry(
  formData: FormData
): Promise<{ ok: true } | { ok: false; error: string }> {
  const authorId = String(formData.get('authorId') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const title = String(formData.get('title') ?? '').trim();
  const content = String(formData.get('content') ?? '').trim();

  if (!authorId || authorId.length > 20) return { ok: false, error: '아이디는 1~20자로 입력해주세요.' };
  if (!/^[A-Za-z0-9]+$/.test(authorId))
    return { ok: false, error: '아이디는 영문과 숫자만 사용할 수 있습니다.' };
  if (password.length < 4 || password.length > 100)
    return { ok: false, error: '비밀번호는 4자 이상 입력해주세요.' };
  if (!title || title.length > 100) return { ok: false, error: '제목은 1~100자로 입력해주세요.' };
  if (!content || content.length > 2000)
    return { ok: false, error: '내용은 1~2000자로 입력해주세요.' };

  const files = formData
    .getAll('images')
    .filter((f): f is File => f instanceof File && f.size > 0);

  if (files.length > MAX_IMAGES) return { ok: false, error: '이미지는 최대 3장까지 첨부할 수 있습니다.' };

  try {
    const supabase = createAdminClient();

    const imagePaths: string[] = [];
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;
      const path = await uploadImage(supabase, file, 'board');
      imagePaths.push(path);
    }

    const { error } = await supabase.from('inquiries').insert({
      author_id: authorId,
      password_hash: hashPassword(password),
      title,
      content,
      image_paths: imagePaths,
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
  image_paths: string[];
  reply: string | null;
  replied_at: string | null;
  created_at: string;
};

// 작성자 본인 열람: 게시글 id + 비밀번호가 일치할 때만 상세(내용/이미지/답변) 반환
export async function viewInquiry(
  id: string,
  password: string
): Promise<{ ok: true; data: InquiryDetail } | { ok: false; error: string }> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('inquiries')
      .select('author_id, password_hash, title, content, image_paths, reply, replied_at, created_at')
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
        image_paths: data.image_paths ?? [],
        reply: data.reply,
        replied_at: data.replied_at,
        created_at: data.created_at,
      },
    };
  } catch {
    return { ok: false, error: '조회 중 오류가 발생했습니다.' };
  }
}
