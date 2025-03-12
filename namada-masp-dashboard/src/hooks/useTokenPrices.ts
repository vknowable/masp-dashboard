import { useQuery } from '@tanstack/react-query'
import { fetchTokenPrices } from '../api/chain'
import type { TokenPricesResponse } from '../api/chain'
import { AxiosError } from 'axios'
import { retryPolicy, retryDelay } from '../api/apiClient'

/**
 * Hook to fetch prices for all tokens
 * @returns Object containing token prices data, loading state, and error
 */
export function useTokenPrices() {
  return useQuery<TokenPricesResponse, AxiosError>({
    queryKey: ['tokenPrices'],
    queryFn: fetchTokenPrices,
    staleTime: 60000, // Consider fresh for 1 minute
    retry: retryPolicy,
    retryDelay: retryDelay,
  })
} 