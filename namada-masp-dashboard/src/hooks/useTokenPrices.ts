import { useQuery } from '@tanstack/react-query'
import { fetchTokenPrices } from '../api/chain'
import type { TokenPricesResponse } from '../api/chain'
import { AxiosError } from 'axios'

/**
 * Hook to fetch prices for all tokens
 * @returns Object containing token prices data, loading state, and error
 */
export function useTokenPrices() {
  return useQuery<TokenPricesResponse, AxiosError>({
    queryKey: ['tokenPrices'],
    queryFn: fetchTokenPrices,
    staleTime: 60000, // Consider fresh for 1 minute
    retry: (failureCount, error) => {
      // Only retry on 5xx errors or network/timeout issues
      const status = error.response?.status
      return (
        failureCount < 3 && // Maximum 3 retries
        (status === undefined || // Network/timeout error
         status >= 500) // Server error
      )
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff capped at 30 seconds
  })
} 