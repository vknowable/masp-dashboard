import { useQuery } from '@tanstack/react-query'
import type { Balance } from '../types/token'
import { AxiosError } from 'axios'
import { fetchMaspBalances, TransformedMaspBalances, MaspBalances } from '../api/chain'
import { useMaspAggregates } from './useMaspAggregates'

/**
 * Calculate net change between inflows and outflows
 */
function calculateNetChange(inflows: string | undefined, outflows: string | undefined): number | null {
  if (!inflows || !outflows) return null;
  return Number(inflows) - Number(outflows);
}

/**
 * Hook to fetch MASP account balances with historical changes
 * @returns Object containing transformed balances data with changes, loading state, and error
 */
export function useMaspBalances() {
  const { data: aggregates } = useMaspAggregates();

  return useQuery<TransformedMaspBalances, AxiosError>({
    queryKey: ['maspBalances'],
    queryFn: async () => {
      const data = await fetchMaspBalances();
      
      return {
        balances: data.balances.map(balance => {
          // Find all aggregates for this token
          const tokenAggregates = aggregates?.filter(agg => agg.tokenAddress === balance.tokenAddress) ?? [];

          // Calculate changes for each time window
          const changes = {
            '24h': calculateNetChange(
              tokenAggregates.find(agg => agg.timeWindow === 'oneDay' && agg.kind === 'inflows')?.totalAmount,
              tokenAggregates.find(agg => agg.timeWindow === 'oneDay' && agg.kind === 'outflows')?.totalAmount
            ),
            '7d': calculateNetChange(
              tokenAggregates.find(agg => agg.timeWindow === 'sevenDays' && agg.kind === 'inflows')?.totalAmount,
              tokenAggregates.find(agg => agg.timeWindow === 'sevenDays' && agg.kind === 'outflows')?.totalAmount
            ),
            '30d': calculateNetChange(
              tokenAggregates.find(agg => agg.timeWindow === 'thirtyDays' && agg.kind === 'inflows')?.totalAmount,
              tokenAggregates.find(agg => agg.timeWindow === 'thirtyDays' && agg.kind === 'outflows')?.totalAmount
            ),
            'allTime': calculateNetChange(
              tokenAggregates.find(agg => agg.timeWindow === 'allTime' && agg.kind === 'inflows')?.totalAmount,
              tokenAggregates.find(agg => agg.timeWindow === 'allTime' && agg.kind === 'outflows')?.totalAmount
            )
          };

          return {
            tokenAddress: balance.tokenAddress,
            balances: {
              current: Number(balance.minDenomAmount),
              changes
            }
          };
        })
      };
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
    enabled: !!aggregates // Only run query when we have aggregates data
  })
} 