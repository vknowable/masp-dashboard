import { useQuery } from "@tanstack/react-query";
import { fetchMaspTxVolume, MaspTxVolumeResponse } from "../api/chain";

export function useMaspTxVolume(startTime: string, endTime: string, resolution: number) {
    return useQuery<MaspTxVolumeResponse>({
        queryKey: ["maspTxVolume", startTime, endTime, resolution],
        queryFn: () => {
            // Check if startTime and endTime are valid ISO date strings
            const isValidDateTime = (dateStr: string) => {
                const date = new Date(dateStr);
                return date instanceof Date && !isNaN(date.getTime()) && dateStr.includes('T');
            };

            if (!isValidDateTime(startTime) || !isValidDateTime(endTime)) {
                return [];
            }

            return fetchMaspTxVolume(startTime, endTime, resolution);
        },
    });
} 