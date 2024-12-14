import {
  AlchemyAccountsUIConfig,
  createConfig,
  cookieStorage,
} from "@account-kit/react";
import { 
  alchemy, 
  sepolia,
  mainnet,
  polygon,
  arbitrum,
  optimism 
} from "@account-kit/infra";
import { QueryClient } from "@tanstack/react-query";
import { shapeMainnet, shapeSepolia } from './chains';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
      staleTime: 5000,
    },
  },
});

const uiConfig: AlchemyAccountsUIConfig = {
  illustrationStyle: "outline",
  auth: {
    sections: [
      [{ type: "email" }],
      [
        { type: "passkey" },
        { 
          type: "social", 
          authProviderId: "google", 
          mode: "popup" 
        },
        { 
          type: "social", 
          authProviderId: "facebook", 
          mode: "popup"
        },
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
  chains: {
    enabled: [mainnet, polygon, arbitrum, optimism, sepolia, shapeMainnet, shapeSepolia],
    default: shapeSepolia,
  },
};

export const config = createConfig(
  {
    transport: alchemy({ 
      apiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY!,
    }),
    chain: shapeMainnet,
    chains: [
      { chain: mainnet },
      { chain: polygon },
      { chain: arbitrum },
      { chain: optimism },
      { chain: shapeMainnet },
      { chain: sepolia },
      { chain: shapeSepolia }
    ],
    ssr: true,
    storage: cookieStorage,
    enablePopupOauth: true,
  },
  uiConfig
); 