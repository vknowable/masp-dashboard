import { useQuery } from '@tanstack/react-query'
import { AggregatesResponse, MaspAggregate, Token } from '../types/token'
import { useTokenList } from './useTokenList'
import { fetchMaspAggregates } from '../api/chain'
import { AxiosError } from 'axios'

// Placeholder data generator - keeping for reference
/*
const generatePlaceholderData = (tokens: Token[]): AggregatesResponse => {
  const timeWindows = ['oneDay', 'sevenDays', 'thirtyDays', 'allTime']
  const kinds = ['inflows', 'outflows']
  
  const data: AggregatesResponse = []
  
  tokens.forEach(token => {
    timeWindows.forEach(window => {
      kinds.forEach(kind => {
        // Generate random amounts between 1000 and 1000000
        const amount = Math.floor(Math.random() * 999000 + 1000).toString()
        
        data.push({
          tokenAddress: token.address,
          timeWindow: window,
          kind: kind,
          totalAmount: amount
        })
      })
    })
  })
  
  return data
}
*/

export function useMaspAggregates() {
  const { data: tokenList = [] } = useTokenList()

  return useQuery<AggregatesResponse, AxiosError>({
    queryKey: ['maspAggregates'],
    queryFn: fetchMaspAggregates,
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 60 * 1000, // 1 minute
    retry: (failureCount, error) => {
      // Only retry on 5xx errors or network/timeout issues
      const status = error.response?.status;
      return (
        failureCount < 3 && // Maximum 3 retries
        (status === undefined || // Network/timeout error
         status >= 500) // Server error
      );
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff capped at 30 seconds
    enabled: tokenList.length > 0 // Only run query when we have tokens
  })
} 