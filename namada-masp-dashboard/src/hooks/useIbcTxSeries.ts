import { useQuery } from "@tanstack/react-query";
import { fetchIbcTxSeries, IbcTxSeriesResponse } from "../api/chain";

export function useIbcTxSeries(startTime: string, endTime: string, resolution: number) {
    return useQuery<IbcTxSeriesResponse>({
        queryKey: ["maspIbcTxSeries", startTime, endTime, resolution],
        queryFn: () => {
            // Check if startTime and endTime are valid ISO date strings
            const isValidDateTime = (dateStr: string) => {
                const date = new Date(dateStr);
                return date instanceof Date && !isNaN(date.getTime()) && dateStr.includes('T');
            };

            if (!isValidDateTime(startTime) || !isValidDateTime(endTime)) {
                return [];
            }

            return fetchIbcTxSeries(startTime, endTime, resolution);
        },
    });
} 