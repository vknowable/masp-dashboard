import { useQuery } from "@tanstack/react-query";
import { fetchTokenSupplies, TransformedTokenSupplies } from "../api/chain";
import { AxiosError } from "axios";
import { retryPolicy, retryDelay } from "../api/apiClient";

/**
 * Calculate net change between two values, handling null cases
 */
function calculateNetChange(
  current: number | null,
  previous: number | null,
): number | null {
  if (current === null || previous === null) return null;
  return current - previous;
}

/**
 * Hook to fetch token supplies data including historical values and net changes
 * @returns Object containing decoded token supplies data with net changes, loading state, and error
 */
export function useTokenSupplies() {
  return useQuery<TransformedTokenSupplies, AxiosError>({
    queryKey: ["tokenSupplies"],
    queryFn: async () => {
      const data = await fetchTokenSupplies();

      return {
        timestamp: data.timestamp,
        supplies: data.supplies.map((token) => {
          const current = token.supplies.current
            ? parseInt(token.supplies.current)
            : null;
          const oneDayAgo = token.supplies["1dAgo"]
            ? parseInt(token.supplies["1dAgo"])
            : null;
          const sevenDaysAgo = token.supplies["7dAgo"]
            ? parseInt(token.supplies["7dAgo"])
            : null;
          const thirtyDaysAgo = token.supplies["30dAgo"]
            ? parseInt(token.supplies["30dAgo"])
            : null;

          return {
            address: token.address,
            supplies: {
              current,
              "1dAgo": oneDayAgo,
              "7dAgo": sevenDaysAgo,
              "30dAgo": thirtyDaysAgo,
              changes: {
                "24h": calculateNetChange(current, oneDayAgo),
                "7d": calculateNetChange(current, sevenDaysAgo),
                "30d": calculateNetChange(current, thirtyDaysAgo),
              },
            },
          };
        }),
      };
    },
    staleTime: 60000, // Consider fresh for 1 minute (matches backend refresh)
    retry: retryPolicy,
    retryDelay: retryDelay,
  });
}
