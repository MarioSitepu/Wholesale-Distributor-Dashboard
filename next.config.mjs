import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development", // Matikan di mode Dev agar tidak mengganggu Anda coding
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swcMinify: true,
  workboxOptions: {
    disableDevLogs: true,
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Ensure we can import from app-react
  transpilePackages: ["lucide-react"],
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  }
};

export default withPWA(nextConfig);
