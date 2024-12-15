/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
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
    };
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, './src'),
    };
    return config;
  },
  experimental: {
    serverActions: true,
    serverComponentsExternalPackages: ['@account-kit/react', '@account-kit/core', '@account-kit/infra'],
  },
  transpilePackages: ['recordrtc', '@account-kit/react', '@account-kit/core', '@account-kit/infra']
};

module.exports = nextConfig; 