/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Ensure we can import from app-react
  transpilePackages: ['lucide-react'],
};

export default nextConfig;
