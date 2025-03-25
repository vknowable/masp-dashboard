import { useQuery } from "@tanstack/react-query";
import { fetchMaspTxVolume, MaspTxVolumeResponse } from "../api/chain";

export function useMaspTxVolume(startTime: string, endTime: string, resolution: number) {
    return useQuery<MaspTxVolumeResponse>({
        queryKey: ["maspTxVolume", startTime, endTime, resolution],
        queryFn: () => fetchMaspTxVolume(startTime, endTime, resolution),
    });
} 