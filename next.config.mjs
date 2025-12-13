/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',  // 정적 HTML 내보내기 (앱 빌드 필수)
  images: {
    unoptimized: true, // 이미지 최적화 비활성화 (정적 export시 필수)
  },
};

export default nextConfig;
