import { useQuery } from "@tanstack/react-query";
import {
  fetchRewardTokens,
  fetchLastInflation,
  fetchMaspEpoch,
  fetchTotalRewards,
} from "../api/chain";
import { AxiosError } from "axios";
import { retryPolicy, retryDelay } from "../api/apiClient";
import {
  MaspEpochResponse,
  MaspInflationResponse,
  MaspTotalRewardsResponse,
  RewardTokensResponse,
} from "../types/masp";

/**
 * Hook to fetch reward tokens data
 * @returns Object containing reward tokens data, loading state, and error
 */
export function useRewardTokens() {
  return useQuery<RewardTokensResponse, AxiosError>({
    queryKey: ["rewardTokens"],
    queryFn: fetchRewardTokens,
    staleTime: 60000, // Consider fresh for 1 minute (matches backend refresh)
    retry: retryPolicy,
    retryDelay: retryDelay,
  });
}

/**
 * Hook to fetch last inflation data
 * @returns Object containing last inflation data, loading state, and error
 */
export function useLastInflation() {
  return useQuery<MaspInflationResponse, AxiosError>({
    queryKey: ["lastInflation"],
    queryFn: fetchLastInflation,
    staleTime: 60000, // Consider fresh for 1 minute (matches backend refresh)
    retry: retryPolicy,
    retryDelay: retryDelay,
  });
}

/**
 * Hook to fetch MASP epoch data
 * @returns Object containing MASP epoch data, loading state, and error
 */
export function useMaspEpoch() {
  return useQuery<MaspEpochResponse, AxiosError>({
    queryKey: ["maspEpoch"],
    queryFn: fetchMaspEpoch,
    staleTime: 60000, // Consider fresh for 1 minute (matches backend refresh)
    retry: retryPolicy,
    retryDelay: retryDelay,
  });
}

/**
 * Hook to fetch total rewards data
 * @returns Object containing total rewards data, loading state, and error
 */
export function useTotalRewards() {
  return useQuery<MaspTotalRewardsResponse, AxiosError>({
    queryKey: ["totalRewards"],
    queryFn: fetchTotalRewards,
    staleTime: 60000, // Consider fresh for 1 minute (matches backend refresh)
    retry: retryPolicy,
    retryDelay: retryDelay,
  });
}
