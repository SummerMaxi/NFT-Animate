"use client";
import { config } from "@/config/accountKit";
import { AlchemyClientState } from "@account-kit/core";
import { AlchemyAccountProvider } from "@account-kit/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { PropsWithChildren, Suspense } from "react";
import { WagmiProvider, createConfig, http } from 'wagmi';
import { shapeMainnet } from '@/config/chains';

// Configure Wagmi
const wagmiConfig = createConfig({
  chains: [shapeMainnet],
  transports: {
    [shapeMainnet.id]: http(
      `https://shape-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`
    ),
  },
});

// Use the existing queryClient from accountKit
import { queryClient } from "@/config/accountKit";

export const Providers = (
  props: PropsWithChildren<{ initialState?: AlchemyClientState }>
) => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <AlchemyAccountProvider
            config={config}
            queryClient={queryClient}
            initialState={props.initialState}
          >
            {props.children}
          </AlchemyAccountProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </Suspense>
  );
}; 