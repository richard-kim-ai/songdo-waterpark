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
      // 업로드 이미지는 클라이언트에서 리사이즈되지만, 투명 PNG(로고) 등은
      // 여전히 1MB 기본 한도를 넘을 수 있어 상향. (Vercel 서버리스는 ~4.5MB 상한)
      bodySizeLimit: '8mb',
    },
  },
};

export default nextConfig;
