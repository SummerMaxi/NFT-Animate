const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    missingSuspenseWithCSRError: false,
    esmExternals: 'loose'
  },
  transpilePackages: [
    'recordrtc', 
    '@account-kit/react', 
    '@account-kit/core', 
    '@account-kit/infra'
  ],
  images: {
    unoptimized: true,
    domains: [
      'dweb.link',
      'shape-mainnet.g.alchemy.com',
      'cloudflare-ipfs.com',
      'gateway.ipfscdn.io',
      'ipfs.io',
      'ipfs.filebase.io',
      'nft-cdn.alchemy.com',
      'res.cloudinary.com',
      'prod-otoms.s3.us-east-1.amazonaws.com',
      'i.seadn.io',
      'arweave.net',
      'storage.googleapis.com'
    ]
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
  }
};

module.exports = nextConfig; 