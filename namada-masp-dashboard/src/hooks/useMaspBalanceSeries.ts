import { useQuery } from "@tanstack/react-query";
import { fetchMaspBalanceSeries, MaspBalanceSeriesResponse } from "../api/chain";

export function useMaspBalanceSeries(startTime: string, endTime: string, resolution: number) {
    return useQuery<MaspBalanceSeriesResponse>({
        queryKey: ["maspTxBalanceSeries", startTime, endTime, resolution],
        queryFn: () => {
            // Check if startTime and endTime are valid ISO date strings
            const isValidDateTime = (dateStr: string) => {
                const date = new Date(dateStr);
                return date instanceof Date && !isNaN(date.getTime()) && dateStr.includes('T');
            };

            if (!isValidDateTime(startTime) || !isValidDateTime(endTime)) {
                return {
                    owner: "tnam1pcqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzmefah",
                    series: []
                };
            }

            return fetchMaspBalanceSeries(startTime, endTime, resolution);
        },
    });
} 