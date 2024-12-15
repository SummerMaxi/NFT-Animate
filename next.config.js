/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Temporarily ignore type errors during build
    ignoreBuildErrors: true,
  },
  eslint: {
    // Temporarily ignore eslint errors during build
    ignoreDuringBuilds: true,
  }
};

module.exports = nextConfig; 