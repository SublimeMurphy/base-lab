"use client";
import { ReactNode } from "react";
import { baseSepolia } from "wagmi/chains";
import { OnchainKitProvider } from "@coinbase/onchainkit";
import { WagmiProvider, createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { farcasterConnector } from "./farcasterConnector";
import "@coinbase/onchainkit/styles.css";

const RPC_URL = process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL ?? "https://sepolia.base.org";

const wagmiConfig = createConfig({
  chains: [baseSepolia],
  transports: {
    [baseSepolia.id]: http(RPC_URL),
  },
  connectors: [farcasterConnector(), injected()],
});

const queryClient = new QueryClient();

export function RootProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig}>
        <OnchainKitProvider
          apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
          chain={baseSepolia}
          config={{
            appearance: {
              mode: "auto",
            },
            wallet: {
              display: "modal",
              preference: "all",
              supportedWallets: {
                frame: true,
              },
            },
          }}
          miniKit={{
            enabled: true,
            autoConnect: true,
          }}
        >
          {children}
        </OnchainKitProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
}
