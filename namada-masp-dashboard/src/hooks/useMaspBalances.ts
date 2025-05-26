import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import {
    fetchMaspBalances,
    fetchMaspBalancesAtTime,
    TransformedTokenAmounts,
    MaspBalances,
} from "../api/chain";
import { retryPolicy, retryDelay } from "../api/apiClient";

/**
 * Calculate UTC timestamp for a given number of days ago
 */
function getTimestampForDaysAgo(days: number): string {
    const now = new Date();
    const utcNow = Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        now.getUTCHours(),
        now.getUTCMinutes(),
        now.getUTCSeconds(),
        now.getUTCMilliseconds()
    );
    const daysAgo = utcNow - (days * 24 * 60 * 60 * 1000);
    return new Date(daysAgo).toISOString();
}

/**
 * Hook to fetch MASP account balances with historical changes
 * @returns Object containing transformed balances data with changes, loading state, and error
 */
export function useMaspBalances() {
    return useQuery<TransformedTokenAmounts, AxiosError>({
        queryKey: ["maspBalances"],
        queryFn: async () => {
            const [currentBalances, dayAgoBalances, weekAgoBalances, monthAgoBalances] = await Promise.all([
                fetchMaspBalancesAtTime(new Date().toISOString()),
                fetchMaspBalancesAtTime(getTimestampForDaysAgo(1)),
                fetchMaspBalancesAtTime(getTimestampForDaysAgo(7)),
                fetchMaspBalancesAtTime(getTimestampForDaysAgo(30)),
            ]);

            return {
                balances: currentBalances.map((balance) => {
                    const currentBalance = Number(balance.raw_amount);

                    // Find historical balances for this token
                    const dayAgoBalance = dayAgoBalances.find(b => b.token === balance.token)?.raw_amount;
                    const weekAgoBalance = weekAgoBalances.find(b => b.token === balance.token)?.raw_amount;
                    const monthAgoBalance = monthAgoBalances.find(b => b.token === balance.token)?.raw_amount;

                    // Calculate changes
                    const changes = {
                        "24h": dayAgoBalance ? currentBalance - Number(dayAgoBalance) : null,
                        "7d": weekAgoBalance ? currentBalance - Number(weekAgoBalance) : null,
                        "30d": monthAgoBalance ? currentBalance - Number(monthAgoBalance) : null,
                        allTime: null, // We don't have this data anymore
                    };

                    return {
                        tokenAddress: balance.token,
                        balances: {
                            current: currentBalance,
                            "1dAgo": dayAgoBalance ? Number(dayAgoBalance) : null,
                            "7dAgo": weekAgoBalance ? Number(weekAgoBalance) : null,
                            "30dAgo": monthAgoBalance ? Number(monthAgoBalance) : null,
                            changes,
                        },
                    };
                }),
            };
        },
        staleTime: 60000, // Consider fresh for 1 minute
        refetchInterval: 30000, // Refetch every 30 seconds
        retry: retryPolicy,
        retryDelay: retryDelay,
    });
}
