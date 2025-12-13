/** @type {import('next').NextConfig} */
import withPWA from 'next-pwa';

const nextConfig = {
    reactStrictMode: true,
};

export default withPWA({
    dest: 'public',
    register: true,
    skipWaiting: true,
    disable: process.env.NODE_ENV === 'development', // 개발 모드에서는 비활성화
})(nextConfig);
