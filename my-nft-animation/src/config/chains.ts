import { type Chain } from 'viem';

export const shapeMainnet: Chain = {
  id: 360,
  name: 'Shape',
  network: 'shape-mainnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    alchemy: {
      http: ['https://shape-mainnet.g.alchemy.com/v2'],
      webSocket: ['wss://shape-mainnet.g.alchemy.com/v2'],
    },
    default: {
      http: ['https://shape-mainnet.g.alchemy.com/v2'],
    },
    public: {
      http: ['https://shape-mainnet.g.alchemy.com/v2'],
    },
  },
  blockExplorers: {
    default: { name: 'Shape Explorer', url: 'https://explorer.shape.network' },
  },
  testnet: false,
};

export const shapeSepolia: Chain = {
  id: 11011,
  name: 'Shape Sepolia',
  network: 'shape-sepolia',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    alchemy: {
      http: ['https://shape-sepolia.g.alchemy.com/v2'],
      webSocket: ['wss://shape-sepolia.g.alchemy.com/v2'],
    },
    default: {
      http: ['https://shape-sepolia.g.alchemy.com/v2'],
    },
    public: {
      http: ['https://shape-sepolia.g.alchemy.com/v2'],
    },
  },
  blockExplorers: {
    default: { name: 'Shape Sepolia Explorer', url: 'https://sepolia.explorer.shape.network' },
  },
  testnet: true,
}; 