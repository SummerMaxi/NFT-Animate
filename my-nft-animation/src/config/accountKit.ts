import {
  AlchemyAccountsUIConfig,
  createConfig,
  cookieStorage,
} from "@account-kit/react";
import { alchemy, sepolia } from "@account-kit/infra";
import { QueryClient } from "@tanstack/react-query";

const uiConfig: AlchemyAccountsUIConfig = {
  illustrationStyle: "outline",
  auth: {
    sections: [
      [{ type: "email" }],
      [
        { type: "passkey" },
        { type: "social", authProviderId: "google", mode: "redirect" },
        { type: "social", authProviderId: "facebook", mode: "redirect" },
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
      apiKey: "pmgsVDBrpuhTuaidTueOo7JicbpGNXDj",
    }),
    chain: sepolia,
    ssr: true,
    storage: cookieStorage,
    enablePopupOauth: false,
    persist: {
      storage: cookieStorage,
      key: 'alchemyAccountState',
    },
  },
  uiConfig
);

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
}); 