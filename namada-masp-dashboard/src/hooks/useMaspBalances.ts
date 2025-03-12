import { useQuery } from '@tanstack/react-query'
import type { Balance } from '../types/token'
import { AxiosError } from 'axios'
import { fetchMaspBalances, TransformedMaspBalances, MaspBalances } from '../api/chain'
import { useMaspAggregates } from './useMaspAggregates'
import { retryPolicy, retryDelay } from '../api/apiClient'

/**
 * Calculate net change between inflows and outflows
 */
function calculateNetChange(inflows: string | undefined, outflows: string | undefined): number | null {
  if (!inflows && !outflows) return null
  return Number(inflows ?? 0) - Number(outflows ?? 0)
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
    retry: retryPolicy,
    retryDelay: retryDelay,
    enabled: !!aggregates // Only run query when we have aggregates data
  })
} 