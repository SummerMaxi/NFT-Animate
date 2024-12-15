import {
  AlchemyAccountsUIConfig,
  createConfig,
} from "@account-kit/react";
import { alchemy } from "@account-kit/infra";
import { cookieStorage } from "@account-kit/core";
import { QueryClient } from "@tanstack/react-query";
import { createPublicClient, http } from 'viem';

// Create a new QueryClient instance
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
      staleTime: 5000,
    },
  },
});

// Define Shape Mainnet chain
export const shapeMainnet = {
  id: 360,
  name: 'Shape',
  network: 'shape',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    alchemy: {
      http: [`https://shape-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`],
      webSocket: [`wss://shape-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`],
    },
    default: {
      http: [`https://shape-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`],
    },
    public: {
      http: [`https://shape-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`],
    },
  },
  blockExplorers: {
    default: {
      name: 'Shape Explorer',
      url: 'https://explorer.shape.network',
    },
  },
};

// UI Config
const uiConfig: AlchemyAccountsUIConfig = {
  illustrationStyle: "outline",
  auth: {
    sections: [
      [{ type: "email" }],
      [
        { type: "passkey" },
        { type: "social", authProviderId: "google", mode: "popup" },
        { type: "social", authProviderId: "facebook", mode: "popup" },
      ],
      [
        {
          type: "external_wallets",
          walletConnect: { projectId: "395f5669ebc3e48ba50c782db80596ec" },
        },
      ],
    ],
    addPasskeyOnSignup: false,
  },
};

// Create config with proper chain configuration
export const config = createConfig(
  {
    transport: alchemy({ 
      apiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY!,
    }),
    chain: shapeMainnet,
    chains: [
      { 
        chain: shapeMainnet,
        transport: alchemy({ apiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY! }),
        policyId: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY,
      }
    ],
    ssr: true,
    storage: cookieStorage,
    enablePopupOauth: true,
  },
  uiConfig
);

// Create a public client
export const publicClient = createPublicClient({
  chain: shapeMainnet,
  transport: http(),
}); 