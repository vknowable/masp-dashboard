import { useQuery } from '@tanstack/react-query';
import { fetchTokenSupplies, TransformedTokenSupplies } from '../api/chain';
import { decodeBorshAmtStr } from '../utils/borsh';
import { AxiosError } from 'axios';

/**
 * Calculate net change between two values, handling null cases
 */
function calculateNetChange(current: number | null, previous: number | null): number | null {
  if (current === null || previous === null) return null;
  return current - previous;
}

/**
 * Hook to fetch token supplies data including historical values and net changes
 * @returns Object containing decoded token supplies data with net changes, loading state, and error
 */
export function useTokenSupplies() {
  return useQuery<TransformedTokenSupplies, AxiosError>({
    queryKey: ['tokenSupplies'],
    queryFn: async () => {
      const data = await fetchTokenSupplies();
      
      return {
        timestamp: data.timestamp,
        supplies: data.supplies.map(token => {
          const current = decodeBorshAmtStr(token.supplies.current);
          const oneDayAgo = decodeBorshAmtStr(token.supplies['1dAgo']);
          const sevenDaysAgo = decodeBorshAmtStr(token.supplies['7dAgo']);
          const thirtyDaysAgo = decodeBorshAmtStr(token.supplies['30dAgo']);

          return {
            address: token.address,
            supplies: {
              current,
              '1dAgo': oneDayAgo,
              '7dAgo': sevenDaysAgo,
              '30dAgo': thirtyDaysAgo,
              changes: {
                '24h': calculateNetChange(current, oneDayAgo),
                '7d': calculateNetChange(current, sevenDaysAgo),
                '30d': calculateNetChange(current, thirtyDaysAgo)
              }
            }
          };
        })
      };
    },
    staleTime: 60000, // Consider fresh for 1 minute (matches backend refresh)
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
  });
} 