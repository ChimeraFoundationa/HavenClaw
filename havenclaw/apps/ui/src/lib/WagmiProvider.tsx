import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, createConfig, WagmiProvider } from 'wagmi'
import { injected } from 'wagmi/connectors'
import type { ReactNode } from 'react'

// Avalanche Fuji Testnet
const fuji = {
  id: 43113,
  name: 'Avalanche Fuji Testnet',
  nativeCurrency: { name: 'AVAX', symbol: 'AVAX', decimals: 18 },
  rpcUrls: {
    default: {
      http: ['https://api.avax-test.network/ext/bc/C/rpc'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Snowscan',
      url: 'https://testnet.snowscan.xyz',
    },
  },
} as const

// Contract Addresses (Fuji Testnet)
export const CONTRACTS = {
  AGENT_REGISTRY: '0x913836702a423d75Ae97e439E6CBF12B7Ae3A6eC',
  ERC6551_REGISTRY: '0x6bbA4040a81c779f356B487c9fcE89EE3308C54a',
  HAVEN_TOKEN: '0x414b10bED95b018Aa8F3A4c027E436e4bECBf1B0',
} as const

// Create wagmi config
const config = createConfig({
  chains: [fuji],
  connectors: [
    injected(),
  ],
  transports: {
    [fuji.id]: http(),
  },
})

// Create react-query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}
