/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
  experimental: {
    serverActions: {
      // 이미지 업로드(로고/배경/갤러리 등)는 기본 1MB 제한을 초과할 수 있어 상향.
      // 참고: Vercel 서버리스는 요청 본문을 약 4.5MB로 제한하므로 프로덕션에서는
      // 그보다 큰 파일은 업로드 전 최적화(리사이즈)가 필요합니다.
      bodySizeLimit: '8mb',
    },
  },
};

export default nextConfig;
