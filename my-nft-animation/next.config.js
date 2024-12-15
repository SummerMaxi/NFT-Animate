const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  distDir: '.next',
  generateBuildId: async () => {
    return 'build-' + Date.now();
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'dweb.link',
        port: '',
        pathname: '/ipfs/**',
      },
      {
        protocol: 'https',
        hostname: 'shape-mainnet.g.alchemy.com',
        port: '',
        pathname: '/**',
      },
      // Keep all your existing remotePatterns
    ],
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      path: false,
      crypto: false,
      stream: false,
      http: false,
      https: false,
      zlib: false
    };
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, './src'),
    };
    config.resolve.mainFields = ['browser', 'module', 'main'];
    return config;
  },
  experimental: {
    esmExternals: false,
    webpackBuildWorker: true
  }
};

module.exports = nextConfig; 