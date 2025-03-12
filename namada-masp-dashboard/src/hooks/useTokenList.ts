import { useQuery } from '@tanstack/react-query'
import type { Token } from '../types/token'
import { AxiosError } from 'axios'
import { fetchTokenList } from '../api/chain'
import { retryPolicy, retryDelay } from '../api/apiClient'

/**
 * Hook to fetch list of all tokens (native and IBC)
 * @returns Object containing tokens data, loading state, and error
 */
export function useTokenList() {
  return useQuery<Token[], AxiosError>({
    queryKey: ['tokenList'],
    queryFn: fetchTokenList,
    staleTime: 300000, // Consider fresh for 5 minutes
    retry: retryPolicy,
    retryDelay: retryDelay,
  })
} 