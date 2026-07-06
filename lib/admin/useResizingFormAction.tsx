'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { resizeFormImages, type ResizeOptions } from '@/lib/admin/resizeImage';

/**
 * 폼 제출 시 이미지 파일을 웹용으로 리사이즈한 뒤 서버 액션을 호출하는 훅.
 * 기존 `<form action={fn}>` 대신 `<form onSubmit={onSubmit}>`로 사용.
 */
export function useResizingFormAction(
  action: (formData: FormData) => Promise<void>,
  options?: { reset?: boolean; resizeOptions?: ResizeOptions }
) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      try {
        await resizeFormImages(formData, options?.resizeOptions);
        await action(formData);
        if (options?.reset) form.reset();
        router.refresh();
      } catch (err) {
        alert(err instanceof Error ? err.message : '업로드 중 오류가 발생했습니다.');
      }
    });
  }

  return { pending, onSubmit };
}
