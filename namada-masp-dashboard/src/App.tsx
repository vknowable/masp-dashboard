// import './App.css'
// import Sidebar from './components/Sidebar'
import Header from './components/Header'
// import init, { Query } from "masp_dashboard_wasm"
import { useState, useEffect } from "react"
import init from "masp_dashboard_wasm"
import InfoGrid from './components/infoGrid/InfoGrid'
import ChartContainer from './components/chart/ChartContainer'
import AssetTableContainer from './components/assetTable/AssetTableContainer'
import IbcChannelsContainer from './components/ibcChannels/IbcChannelsContainer'
import { useQuery } from '@tanstack/react-query'
import { fetchChainMetadata } from './api/chainRegistry'
import { fetchMaspInfo } from './api/tokens'
import { IbcChannel } from './components/ibcChannels/IbcChannelCard'
import { QueryClient, QueryClientProvider, DefaultOptions } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import TokenTable from './components/TokenTable'
import { AxiosError } from 'axios'

// Create a client
const defaultOptions: DefaultOptions = {
  queries: {
    refetchOnWindowFocus: false,
    retry: (failureCount: number, error: Error) => {
      // Only retry on 5xx errors or network/timeout issues
      if (error instanceof AxiosError) {
        const status = error.response?.status
        return (
          failureCount < 3 && // Maximum 3 retries
          (status === undefined || // Network/timeout error
           status >= 500) // Server error
        )
      }
      return false // Don't retry other types of errors
    },
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff capped at 30 seconds
    staleTime: 1000 * 60, // Consider data fresh for 1 minute
    gcTime: 1000 * 60 * 5, // Keep unused data in cache for 5 minutes
  }
}

const queryClient = new QueryClient({ defaultOptions })

function App() {
  // Use dark mode as the default theme, unless a previously saved preference is found in storage
  const savedTheme = localStorage.getItem('theme');
  const defaultTheme = savedTheme ? savedTheme : 'dark';
  const [darkMode, setDarkMode] = useState(defaultTheme === 'dark');

  // Fetch registry data
  const { data: registryData, isLoading: isLoadingRegistry, error: registryError } = useQuery({
    queryKey: ['registryData'],
    queryFn: () => fetchChainMetadata("namada", true)
  });

  // Fetch MASP info
  // const { data: maspInfo, isLoading: isLoadingMasp, error: maspError } = useQuery({
  //   queryKey: ['maspInfo'],
  //   queryFn: fetchMaspInfo,
  //   refetchInterval: 30000,
  //   staleTime: 300000,
  // });

  // Transform ibcMetadata into IbcChannel format
  const channels: IbcChannel[] = registryData?.ibcMetadata?.map((conn, index) => {
    // Helper function to get chain details from registry data
    const getChainDetails = (chainName: string) => {
      if (registryData.chain.chain_name === chainName) {
        return {
          chainId: registryData.chain.chain_id,
          prettyName: registryData.chain.pretty_name,
          logoUri: "https://raw.githubusercontent.com/anoma/namada-chain-registry/main/namada/images/namada.svg"
        };
      }
      const counterparty = registryData.counterParties.find(cp => cp.chain.chain_name === chainName);
      return {
        chainId: counterparty?.chain.chain_id || 'unknown',
        prettyName: counterparty?.chain.pretty_name || chainName,
        logoUri: counterparty?.chain.logo_URIs?.svg || "https://raw.githubusercontent.com/anoma/namada-chain-registry/main/namada/images/namada.svg"
      };
    };

    const chain1Details = getChainDetails(conn.chain_1.chain_name);
    const chain2Details = getChainDetails(conn.chain_2.chain_name);

    return {
      id: index.toString(),
      status: 'active',
      chainA: {
        name: chain1Details.prettyName,
        chainId: chain1Details.chainId,
        connectionId: conn.chain_1.connection_id,
        clientId: conn.chain_1.client_id,
        portId: conn.channels[0]?.chain_1.port_id || 'transfer',
        channelId: conn.channels[0]?.chain_1.channel_id || '',
        logoUri: chain1Details.logoUri
      },
      chainB: {
        name: chain2Details.prettyName,
        chainId: chain2Details.chainId,
        connectionId: conn.chain_2.connection_id,
        clientId: conn.chain_2.client_id,
        portId: conn.channels[0]?.chain_2.port_id || 'transfer',
        channelId: conn.channels[0]?.chain_2.channel_id || '',
        logoUri: chain2Details.logoUri
      }
    };
  }) || [];

  // Update the theme
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  useEffect(() => {
    (async () => {
      // Initialize the WASM module
      await init()
    })()
  }, [])

  const infoCards = [
    { topText: "Total Shielded Assets", topTextColor: "text-[#3A3A3A]", bottomText: "$1,004,092,196.26", bottomTextColor: "text-black", bgColor: "bg-[#FFFF00]", size: 'large' as const },
    { topText: "Total NAM rewards minted", topTextColor: "text-[#3A3A3A]", bottomText: "$1,004,092,196.26", bottomTextColor: "text-black", bgColor: "bg-[#FFFF00]", size: 'large' as const },
    { topText: "NAM rewards minted per EPOCH", topTextColor: "text-[#3A3A3A]", bottomText: "$1,004,092,196.26", bottomTextColor: "text-black", bgColor: "bg-[#FFFF00]", size: 'large' as const },
    { topText: "Block Time", topTextColor: "text-black dark:text-white", bottomText: "6.91 sec", bottomTextColor: "text-black dark:text-[#FFFF00]", bgColor: "bg-[#F5F5F5] dark:bg-[#191919]", size: 'small' as const },
    { topText: "Block Height", topTextColor: "text-black dark:text-white", bottomText: "536,341", bottomTextColor: "text-black dark:text-[#FFFF00]", bgColor: "bg-[#F5F5F5] dark:bg-[#191919]", size: 'small' as const },
    { topText: "POS Inflation", topTextColor: "text-black dark:text-white", bottomText: "5.00%", bottomTextColor: "text-black dark:text-[#FFFF00]", bgColor: "bg-[#F5F5F5] dark:bg-[#191919]", size: 'small' as const },
    { topText: "Staking APR", topTextColor: "text-black dark:text-white", bottomText: "12.40%", bottomTextColor: "text-black dark:text-[#FFFF00]", bgColor: "bg-[#F5F5F5] dark:bg-[#191919]", size: 'small' as const },
    { topText: "Total native supply", topTextColor: "text-black dark:text-white", bottomText: "1,004,092,196.26 NAM (1.00B)", bottomTextColor: "text-black dark:text-[#FFFF00]", bgColor: "bg-[#F5F5F5] dark:bg-[#191919]", size: 'small' as const },
    { topText: "Total staked", topTextColor: "text-black dark:text-white", bottomText: "404,775,222.6639 (40.31%)", bottomTextColor: "text-black dark:text-[#FFFF00]", bgColor: "bg-[#F5F5F5] dark:bg-[#191919]", size: 'small' as const },
  ]

  // Early return for loading state
  if (isLoadingRegistry) {
    return (
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen flex flex-col p-[24px] bg-white dark:bg-[#121212] text-black dark:text-white">
          <header className="flex justify-between items-center">
            <Header />
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-md bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
          </header>
          <main className="flex-1">
            <div className="animate-pulse space-y-4">
              <div className="h-48 bg-gray-700/20 rounded" />
              <div className="h-96 bg-gray-700/20 rounded" />
              <div className="h-96 bg-gray-700/20 rounded" />
            </div>
          </main>
        </div>
      </QueryClientProvider>
    );
  }

  // Early return for error state
  if (registryError) {
    return (
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen flex flex-col p-[24px] bg-white dark:bg-[#121212] text-black dark:text-white">
          <header className="flex justify-between items-center">
            <Header />
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-md bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
          </header>
          <main className="flex-1">
            <div className="rounded-lg bg-red-500/10 border border-red-500 p-4 text-red-500">
              <h2 className="text-lg font-semibold mb-2">Error Loading Data</h2>
              <p>{registryError instanceof Error ? registryError.message : 'Failed to load registry data'}</p>
              <button 
                onClick={() => queryClient.invalidateQueries({ queryKey: ['registryData'] })}
                className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              >
                Retry
              </button>
            </div>
          </main>
        </div>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen flex flex-col p-[24px] bg-white dark:bg-[#121212] text-black dark:text-white">
        <header className="flex justify-between items-center">
          <Header />
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-md bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </header>

        <main className="flex-1">
          <InfoGrid cards={infoCards} />
          <ChartContainer />
          <TokenTable chainData={registryData} />
          <IbcChannelsContainer channels={channels} />
        </main>
      </div>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}

export default App
