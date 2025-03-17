// import './App.css'
import Header from "./components/Header";
import { useState, useEffect } from "react";
import InfoGridContainer from "./components/infoGrid/InfoGridContainer";
import AssetTableContainer from "./components/assetTable/AssetTableContainer";
import IbcChannelsContainer from "./components/ibcChannels/IbcChannelsContainer";
import {
    QueryClient,
    QueryClientProvider,
    DefaultOptions,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { retryPolicy, retryDelay } from "./api/apiClient";
import ChartContainer from "./components/chart/ChartContainer";
import ErrorBoundary from "./components/common/ErrorBoundary";

// Create a client
const defaultOptions: DefaultOptions = {
    queries: {
        refetchOnWindowFocus: false,
        retry: retryPolicy,
        retryDelay: retryDelay,
        staleTime: 1000 * 60, // Consider data fresh for 1 minute
        gcTime: 1000 * 60 * 5, // Keep unused data in cache for 5 minutes
    },
};

const queryClient = new QueryClient({ defaultOptions });

function App() {
    // Use dark mode as the default theme, unless a previously saved preference is found in storage
    const savedTheme = localStorage.getItem("theme");
    const defaultTheme = savedTheme ? savedTheme : "dark";
    const [darkMode, setDarkMode] = useState(defaultTheme === "dark");

    // Update the theme
    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add("dark");
            localStorage.setItem("theme", "dark");
        } else {
            document.documentElement.classList.remove("dark");
            localStorage.setItem("theme", "light");
        }
    }, [darkMode]);

    // TODO: where to handle loading/error states?
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
            <ErrorBoundary
                fallback={
                    <div className="min-h-screen bg-[#121212] text-white p-8">
                        <div className="max-w-7xl mx-auto">
                            <Header />
                            <div className="mt-12">
                                <div className="text-2xl font-medium mb-4">
                                    Something went wrong
                                </div>
                                <div className="text-red-400 bg-red-900/20 rounded-lg p-6">
                                    <p className="mb-6">
                                        The application encountered an error. You can try to recover
                                        by clicking the button below, or refresh the page if the
                                        problem persists.
                                    </p>
                                    <button
                                        onClick={() => window.location.reload()}
                                        className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 
                             rounded-md transition-colors border border-red-500/30"
                                    >
                                        Reload Application
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                }
            >
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

                    <main className="flex-1 pb-16">
                        <div className="rounded-lg bg-yellow-500/10 border border-yellow-500 p-4 text-yellow-500 mb-12">
                            <p className="font-semibold text-xl text-center py-8">
                                WIP: Data on this page likely to be inaccurate
                            </p>
                        </div>
                        <InfoGridContainer />
                        <ChartContainer />
                        <AssetTableContainer />
                        <IbcChannelsContainer />
                    </main>
                </div>
                <ReactQueryDevtools initialIsOpen={false} />
            </ErrorBoundary>
        </QueryClientProvider>
    );
}

export default App;
