// import './App.css'
import Header from './components/Header'
// import init, { Query } from "masp_dashboard_wasm"
import { useState, useEffect } from "react"
import init from "masp_dashboard_wasm"
import InfoGrid from './components/infoGrid/InfoGrid'
import ChartContainer from './components/chart/ChartContainer'
import AssetTableContainer from './components/assetTable/AssetTableContainer'
import IbcChannelsContainer from './components/ibcChannels/IbcChannelsContainer'
import { QueryClient, QueryClientProvider, DefaultOptions } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { AxiosError } from 'axios'
import { useChainInfo } from './hooks/useChainInfo'
import { denomAmount, formatNumber, formatMagnitude, formatPercentage } from './utils/numbers'

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

  // TODO: refactor useChainInfo
  const { metrics: chainMetrics, isLoading: isLoadingChain } = useChainInfo()

  // Calculate staked percentage safely
  const calculateStakedPercentage = () => {
    const totalStaked = parseFloat(chainMetrics.totalStaked) // already denominated in NAM
    const totalSupply = denomAmount(chainMetrics.totalSupply)
    
    if (!totalSupply || isNaN(totalStaked) || totalSupply === 0) {
      return null
    }
    
    return (totalStaked / totalSupply) * 100
  }

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

  // TODO: refactor infoGrid
  const infoCards = [
    { 
      topText: "Total Shielded Assets", 
      bottomText: `$${formatNumber(denomAmount(chainMetrics.totalShieldedAssets))}`, 
      size: 'large' as const,
      variant: 'primary' as const
    },
    { 
      topText: "Total NAM rewards minted", 
      bottomText: `${formatNumber(denomAmount(chainMetrics.totalRewardsMinted))} NAM`, 
      size: 'large' as const,
      variant: 'primary' as const
    },
    { 
      topText: "NAM rewards minted per EPOCH", 
      bottomText: `$${formatNumber(denomAmount(chainMetrics.rewardsPerEpoch))}`, 
      size: 'large' as const,
      variant: 'primary' as const
    },
    { 
      topText: "Block Time", 
      bottomText: chainMetrics.blockTime ? `${formatNumber(chainMetrics.blockTime, 2)} sec` : '--', 
      size: 'small' as const,
      variant: 'secondary' as const
    },
    { 
      topText: "Block Height", 
      bottomText: chainMetrics.blockHeight !== null ? formatNumber(chainMetrics.blockHeight, 0) : '--', 
      size: 'small' as const,
      variant: 'secondary' as const
    },
    { 
      topText: "Epoch", 
      bottomText: `${chainMetrics.epoch}`, 
      size: 'small' as const,
      variant: 'secondary' as const
    },
    { 
      topText: "Staking APR", 
      bottomText: chainMetrics.stakingApr !== null ? `${formatNumber(chainMetrics.stakingApr * 100)}%` : '--', 
      size: 'small' as const,
      variant: 'secondary' as const
    },
    { 
      topText: "Total native supply", 
      bottomText: chainMetrics.totalSupply && chainMetrics.totalSupply !== "0" 
        ? `${formatNumber(denomAmount(chainMetrics.totalSupply))} NAM ${formatMagnitude(denomAmount(chainMetrics.totalSupply))}` 
        : '--', 
      size: 'small' as const,
      variant: 'secondary' as const
    },
    { 
      topText: "Total staked", 
      bottomText: chainMetrics.totalStaked === "0" 
        ? '--' 
        : `${formatNumber(chainMetrics.totalStaked)} (${formatPercentage(calculateStakedPercentage())})`, 
      size: 'small' as const,
      variant: 'secondary' as const
    },
  ]

  // TODO: where to handle loading/erros states?
  // // Early return for loading state
  // if (isLoading || isLoadingChain) {
  //   return (
  //     <QueryClientProvider client={queryClient}>
  //       <div className="min-h-screen flex flex-col p-[24px] bg-white dark:bg-[#121212] text-black dark:text-white">
  //         <header className="flex justify-between items-center">
  //           <Header />
  //           {/* <button
  //             onClick={() => setDarkMode(!darkMode)}
  //             className="p-2 rounded-md bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
  //           >
  //             {darkMode ? '☀️' : '🌙'}
  //           </button> */}
  //         </header>
  //         <main className="flex-1">
  //           <div className="animate-pulse space-y-4">
  //             <div className="h-48 bg-gray-700/20 rounded" />
  //             <div className="h-96 bg-gray-700/20 rounded" />
  //             <div className="h-96 bg-gray-700/20 rounded" />
  //           </div>
  //         </main>
  //       </div>
  //     </QueryClientProvider>
  //   );
  // }

  // // Early return for error state
  // if (error) {
  //   return (
  //     <QueryClientProvider client={queryClient}>
  //       <div className="min-h-screen flex flex-col p-[24px] bg-white dark:bg-[#121212] text-black dark:text-white">
  //         <header className="flex justify-between items-center">
  //           <Header />
  //           {/* <button
  //             onClick={() => setDarkMode(!darkMode)}
  //             className="p-2 rounded-md bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
  //           >
  //             {darkMode ? '☀️' : '🌙'}
  //           </button> */}
  //         </header>
  //         <main className="flex-1">
  //           <div className="rounded-lg bg-red-500/10 border border-red-500 p-4 text-red-500">
  //             <h2 className="text-lg font-semibold mb-2">Error Loading Data</h2>
  //             <p>{error instanceof Error ? error.message : 'Failed to load registry data'}</p>
  //             <button 
  //               onClick={() => queryClient.invalidateQueries({ queryKey: ['registryData'] })}
  //               className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
  //             >
  //               Retry
  //             </button>
  //           </div>
  //         </main>
  //       </div>
  //     </QueryClientProvider>
  //   );
  // }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen flex flex-col p-[24px] bg-white dark:bg-[#121212] text-black dark:text-white">
        <header className="flex justify-between items-center">
          <Header />
          {/* <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-md bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
          >
            {darkMode ? '☀️' : '🌙'}
          </button> */}
        </header>

        <main className="flex-1">
          <div className="rounded-lg bg-yellow-500/10 border border-yellow-500 p-4 text-yellow-500 mb-12">
            <p className="font-semibold text-xl text-center py-8">WIP: Data on this page likely to be inaccurate</p>
          </div>
          <InfoGrid cards={infoCards} />
          <ChartContainer />
          <AssetTableContainer />
          <IbcChannelsContainer />
        </main>
      </div>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}

export default App
