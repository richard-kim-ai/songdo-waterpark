// 브라우저에서 이미지 업로드 전 웹용 크기로 리사이즈/압축하는 유틸.
// 서버로 보내는 payload를 줄여 업로드 용량/속도를 개선하고 본문 크기 제한을 회피합니다.
// (클라이언트 컴포넌트에서만 사용)

export type ResizeOptions = {
  /** 가로/세로 중 긴 변의 최대 픽셀 (기본 1600) */
  maxDimension?: number;
  /** WebP/JPEG 압축 품질 0~1 (기본 0.82) */
  quality?: number;
};

// 벡터/애니메이션은 캔버스로 처리하면 손상되므로 원본 유지
const SKIP_TYPES = new Set(['image/svg+xml', 'image/gif']);

/**
 * 이미지 파일을 웹용 크기로 리사이즈/압축한 새 File을 반환.
 * - 긴 변이 maxDimension을 넘으면 비율 유지 축소
 * - 기본은 WebP(투명도 보존 + 고압축), 미지원 브라우저는 PNG/JPEG로 폴백
 * - 디코딩 실패(예: HEIC 미지원)나 결과가 더 크면 원본을 그대로 반환
 */
export async function resizeImageFile(file: File, opts: ResizeOptions = {}): Promise<File> {
  const maxDimension = opts.maxDimension ?? 1600;
  const quality = opts.quality ?? 0.82;

  if (!file.type.startsWith('image/') || SKIP_TYPES.has(file.type)) {
    return file;
  }

  try {
    // EXIF 방향 반영(지원 브라우저) → 세로로 찍은 사진이 눕지 않도록
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });

    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      bitmap.close?.();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();

    // 우선 WebP로 인코딩(투명도 지원 + JPEG/PNG 대비 용량 절감).
    // 미지원 브라우저는 toBlob이 PNG로 폴백하므로 결과 타입을 확인해 걸러냄.
    let blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/webp', quality)
    );
    let outType = 'image/webp';
    let ext = 'webp';

    if (!blob || blob.type !== 'image/webp') {
      const isPng = file.type === 'image/png';
      outType = isPng ? 'image/png' : 'image/jpeg';
      ext = isPng ? 'png' : 'jpg';
      blob = await new Promise((resolve) =>
        canvas.toBlob((b) => resolve(b), outType, isPng ? undefined : quality)
      );
    }

    if (!blob || blob.size >= file.size) {
      return file; // 인코딩 실패 또는 원본이 더 작으면 원본 사용
    }

    const baseName = file.name.replace(/\.[^.]+$/, '') || 'image';
    return new File([blob], `${baseName}.${ext}`, {
      type: outType,
      lastModified: Date.now(),
    });
  } catch {
    return file; // 디코딩 불가 등 예외 시 원본으로 폴백
  }
}

/**
 * FormData 안의 모든 이미지 File 필드를 리사이즈된 파일로 교체.
 */
export async function resizeFormImages(formData: FormData, opts?: ResizeOptions): Promise<void> {
  const entries = Array.from(formData.entries());
  for (const [key, value] of entries) {
    if (value instanceof File && value.size > 0) {
      const resized = await resizeImageFile(value, opts);
      if (resized !== value) {
        formData.set(key, resized);
      }
    }
  }
}
