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
  // Ensure proper transpilation of dependencies
  transpilePackages: ['yahoo-finance2'],
  // Configure external packages for serverless
  experimental: {
    serverComponentsExternalPackages: ['yahoo-finance2'],
  },
}

module.exports = nextConfig
