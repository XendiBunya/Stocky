/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    NEXT_PUBLIC_APP_NAME: 'Stock Anomaly Detector',
  },
  // Optimize for Vercel deployment
  compress: true,
  poweredByHeader: false,
}

module.exports = nextConfig
