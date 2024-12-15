"use client";
import { config, shapeMainnet } from "@/config/accountKit";
import { AlchemyClientState } from "@account-kit/core";
import { AlchemyAccountProvider } from "@account-kit/react";
import { PropsWithChildren } from "react";
import { WagmiProvider, createConfig, http } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from "@/config/accountKit";

// Create a new query client
const wagmiQueryClient = new QueryClient();

// Configure Wagmi
const wagmiConfig = createConfig({
  chains: [shapeMainnet],
  transports: {
    [shapeMainnet.id]: http(
      `https://shape-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`
    ),
  },
});

interface ProvidersProps {
  initialState?: AlchemyClientState;
}

export function Providers({ 
  children,
  initialState 
}: PropsWithChildren<ProvidersProps>) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={wagmiQueryClient}>
        <AlchemyAccountProvider
          config={config}
          queryClient={queryClient}
          initialState={initialState}
        >
          {children}
        </AlchemyAccountProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
} 