import { useQuery } from "@tanstack/react-query";
import { AggregatesResponse, FlowAggregate, Token } from "../types/token";
import { useTokenList } from "./useTokenList";
import { fetchIbcAggregates } from "../api/chain";
import { AxiosError } from "axios";
import { retryPolicy, retryDelay } from "../api/apiClient";

export function useIbcAggregates() {
    const { data: tokenList = [] } = useTokenList();

    return useQuery<AggregatesResponse, AxiosError>({
        queryKey: ["ibcAggregates"],
        queryFn: fetchIbcAggregates,
        staleTime: 60 * 1000, // 1 minute
        refetchInterval: 60 * 1000, // 1 minute
        retry: retryPolicy,
        retryDelay: retryDelay,
        enabled: tokenList.length > 0, // Only run query when we have tokens
    });
}
