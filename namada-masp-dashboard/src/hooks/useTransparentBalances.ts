import { useQuery } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { TransformedTokenAmounts } from '../api/chain'
import { useTokenSupplies } from './useTokenSupplies'
import { useMaspBalances } from './useMaspBalances'
import { BalanceInterval, ChangeInterval } from '../api/chain'

/**
 * Hook to calculate transparent token amounts and changes
 * @returns Object containing transformed transparent amounts data with changes, loading state, and error
 */
export function useTransparentBalances() {
  const { data: tokenSupplies } = useTokenSupplies();
  const { data: maspBalances } = useMaspBalances();

  return useQuery<TransformedTokenAmounts, AxiosError>({
    queryKey: ['transparentAmounts', tokenSupplies?.timestamp, maspBalances?.balances],
    queryFn: () => {
      if (!tokenSupplies || !maspBalances) {
        throw new Error('Missing required data');
      }

      return {
        balances: tokenSupplies.supplies.map(supply => {
          // Find corresponding MASP balance for this token
          const maspBalance = maspBalances.balances.find(
            balance => balance.tokenAddress === supply.address
          );

          // If no MASP balance found, return null values
          if (!maspBalance) {
            return {
              tokenAddress: supply.address,
              balances: {
                current: null,
                '1dAgo': null,
                '7dAgo': null,
                '30dAgo': null,
                changes: {
                  '24h': null,
                  '7d': null,
                  '30d': null,
                  'allTime': null
                }
              }
            };
          }

          // Calculate transparent balances at each interval
          const intervals: BalanceInterval[] = ['current', '1dAgo', '7dAgo', '30dAgo']

          const transparentBalances = intervals.reduce((acc, interval) => {
            acc[interval] = supply.supplies[interval] !== null
              ? Number(supply.supplies[interval]) - Number(maspBalance.balances[interval])
              : null
            return acc
          }, {} as Record<BalanceInterval, number | null>)

          // Calculate net changes
          const changeIntervals: ChangeInterval[] = ['24h', '7d', '30d', 'allTime']

          const changes = changeIntervals.reduce((acc, changeInterval) => {
            if (changeInterval === 'allTime') return acc
            const referenceInterval = changeInterval === '24h' ? '1dAgo' : `${changeInterval}Ago` as BalanceInterval;
            acc[changeInterval] = transparentBalances.current !== null && transparentBalances[referenceInterval] !== null
              ? transparentBalances.current - transparentBalances[referenceInterval]
              : null;
            return acc;
          }, {} as Record<ChangeInterval, number | null>);

          return {
            tokenAddress: supply.address,
            balances: {
              ...transparentBalances,
              changes
            }
          };
        })
      };
    },
    enabled: !!tokenSupplies && !!maspBalances,
    staleTime: 60000, // Consider fresh for 1 minute
    refetchInterval: 30000, // Refetch every 30 seconds
  });
} 