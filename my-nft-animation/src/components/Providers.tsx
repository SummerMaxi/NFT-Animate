"use client";
import { config } from "@/config/accountKit";
import { AlchemyClientState } from "@account-kit/core";
import { AlchemyAccountProvider } from "@account-kit/react";
import { PropsWithChildren } from "react";
import { WagmiProvider, createConfig, http } from 'wagmi';
import { queryClient } from "@/config/accountKit";
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

interface ProvidersProps {
  initialState?: AlchemyClientState;
}

export function Providers({ 
  children,
  initialState 
}: PropsWithChildren<ProvidersProps>) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <AlchemyAccountProvider
        config={config}
        queryClient={queryClient}
        initialState={initialState}
      >
        {children}
      </AlchemyAccountProvider>
    </WagmiProvider>
  );
} 