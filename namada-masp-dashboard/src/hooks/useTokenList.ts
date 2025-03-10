import { useQuery } from '@tanstack/react-query'
import apiClient from '../api/apiClient'
import type { Token } from '../types/token'
import { AxiosError } from 'axios'

const indexerUrl = import.meta.env.VITE_INDEXER_URL

/**
 * Hook to fetch list of all tokens (native and IBC)
 * @returns Object containing tokens data, loading state, and error
 */
export function useTokenList() {
  return useQuery<Token[], AxiosError>({
    queryKey: ['tokenList'],
    queryFn: async () => {
      const { data } = await apiClient.get(`${indexerUrl}/api/v1/chain/token`)
      return data
    },
    staleTime: 300000, // Consider fresh for 5 minutes
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