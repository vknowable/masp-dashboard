import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { retryPolicy, retryDelay } from "../api/apiClient";
import { fetchIbcTxCount, IbcTxCountResponse } from "../api/chain";

export function useIbcTxCount(timeWindow: string) {
    return useQuery<IbcTxCountResponse, AxiosError>({
        queryKey: ["ibcTxCount", timeWindow],
        queryFn: () => fetchIbcTxCount(timeWindow),
        staleTime: 10000, // Consider fresh for 10 seconds
        retry: retryPolicy,
        retryDelay: retryDelay,
    });
}