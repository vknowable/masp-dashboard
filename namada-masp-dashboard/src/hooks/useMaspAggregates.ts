import { useQuery } from '@tanstack/react-query'
import { AggregatesResponse, MaspAggregate, Token } from '../types/token'
import { useTokenList } from './useTokenList'

// Placeholder data generator
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

export function useMaspAggregates() {
  const { data: tokenList = [] } = useTokenList()

  return useQuery({
    queryKey: ['maspAggregates', tokenList],
    queryFn: async () => {
      // TODO: Replace with actual API call when endpoint is ready
      // const response = await fetch(`${import.meta.env.VITE_INDEXER_URL}/api/v1/masp/aggregates`)
      // if (!response.ok) throw new Error('Failed to fetch MASP aggregates')
      // return response.json()
      
      // Return placeholder data for now
      return generatePlaceholderData(tokenList)
    },
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 60 * 1000, // 1 minute
    enabled: tokenList.length > 0 // Only run query when we have tokens
  })
} 