import {
  AlchemyAccountsUIConfig,
  createConfig,
} from "@account-kit/react";
import { alchemy } from "@account-kit/infra";
import { cookieStorage } from "@account-kit/core";
import { defineChain } from 'viem';

// Define the Shape Mainnet chain
const shapeMainnet = defineChain({
  id: 360,
  name: 'Shape Mainnet',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://shape-mainnet.g.alchemy.com/v2'],
    },
    public: {
      http: ['https://shape-mainnet.g.alchemy.com/v2'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Shape Explorer',
      url: 'https://explorer.shape.network'
    }
  }
});

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

export const config = createConfig(
  {
    transport: alchemy({ 
      apiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY!,
    }),
    chain: shapeMainnet,
    ssr: true,
    storage: cookieStorage,
    enablePopupOauth: true,
  },
  uiConfig
); 