"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { config } from "../lib/wagmi-config";
import { useState, type ReactNode } from "react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryKeyHashFn: (key) => JSON.stringify(key),
      staleTime: 30000, // 30 seconds
      retry: 1,
    },
  },
});

export function Web3Provider({ children }: { children: ReactNode }) {
  const [queryClientInstance] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        queryKeyHashFn: (key) => JSON.stringify(key),
        staleTime: 30000,
        retry: 1,
      },
    },
  }));

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClientInstance}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
