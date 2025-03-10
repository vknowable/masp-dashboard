import { useQuery } from '@tanstack/react-query'
import apiClient from '../api/apiClient'
import type { Balance } from '../types/token'
import { AxiosError } from 'axios'

const indexerUrl = import.meta.env.VITE_INDEXER_URL
const MASP_ADDRESS = 'tnam1pcqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzmefah'

/**
 * Hook to fetch MASP account balances
 * @returns Object containing balances data, loading state, and error
 */
export function useMaspBalances() {
  return useQuery<Balance[], AxiosError>({
    queryKey: ['maspBalances'],
    queryFn: async () => {
      const { data } = await apiClient.get(`${indexerUrl}/api/v1/account/${MASP_ADDRESS}`)
      return data
    },
    staleTime: 60000, // Consider fresh for 1 minute
    refetchInterval: 30000, // Refetch every 30 seconds
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