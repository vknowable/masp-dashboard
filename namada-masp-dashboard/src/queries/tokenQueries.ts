// import { useQuery } from '@tanstack/react-query'
// // import { RegistryData, MaspMetrics, TokenPrices } from '../types/tokens'
// import { RegistryChainJson } from '../types/chainRegistry'
// import { AggregatesResponse, CgPriceResponse } from '../types/token'
// // API functions
// async function fetchTokenRegistry(): Promise<RegistryChainJson> {
//   const response = await fetch('https://api.namada.net/v1/registry')
//   if (!response.ok) {
//     throw new Error('Failed to fetch token registry')
//   }
//   return response.json()
// }

// async function fetchMaspMetrics(): Promise<AggregatesResponse> {
//   const response = await fetch('https://api.namada.net/v1/masp/aggregates')
//   if (!response.ok) {
//     throw new Error('Failed to fetch MASP metrics')
//   }
//   return response.json()
// }

// async function fetchTokenPrices(): Promise<CgPriceResponse> {
//   const response = await fetch('https://api.namada.net/v1/prices')
//   if (!response.ok) {
//     throw new Error('Failed to fetch token prices')
//   }
//   return response.json()
// }

// // Query hooks
// export function useTokenRegistry() {
//   return useQuery({
//     queryKey: ['tokenRegistry'],
//     queryFn: fetchTokenRegistry,
//     staleTime: 1000 * 60 * 5, // Consider registry data fresh for 5 minutes
//   })
// }

// export function useMaspMetrics() {
//   return useQuery({
//     queryKey: ['maspMetrics'],
//     queryFn: fetchMaspMetrics,
//     // Refetch every minute for real-time updates
//     refetchInterval: 1000 * 60,
//     placeholderData: (previousData) => previousData
//   })
// }

// export function useTokenPrices() {
//   return useQuery({
//     queryKey: ['tokenPrices'],
//     queryFn: fetchTokenPrices,
//     // Prices change frequently, so refetch often
//     refetchInterval: 1000 * 30, // 30 seconds
//     placeholderData: (previousData) => previousData
//   })
// } 