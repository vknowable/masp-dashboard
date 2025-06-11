import { useQuery } from "@tanstack/react-query";
import { fetchPosParams } from "../api/chain";
import { PosParams } from "../api/chain";

export function usePosParams() {
    return useQuery<PosParams>({
        queryKey: ["posParams"],
        queryFn: fetchPosParams,
    });
} 