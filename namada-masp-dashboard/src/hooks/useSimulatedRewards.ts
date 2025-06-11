import { useQuery } from "@tanstack/react-query";
import { fetchSimulatedRewards } from "../api/chain";
import type { SimulatedRewardsResponse } from "../api/chain";
import { AxiosError } from "axios";
import { retryPolicy, retryDelay } from "../api/apiClient";

/**
 * Hook to fetch simulated rewards data
 * @returns Object containing simulated rewards data, loading state, and error
 */
export function useSimulatedRewards() {
    return useQuery<SimulatedRewardsResponse, AxiosError>({
        queryKey: ["simulatedRewards"],
        queryFn: fetchSimulatedRewards,
        staleTime: 60000, // Consider fresh for 1 minute
        retry: retryPolicy,
        retryDelay: retryDelay,
    });
} 