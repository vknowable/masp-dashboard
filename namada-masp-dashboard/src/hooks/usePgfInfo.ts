import { useQuery } from "@tanstack/react-query";
import { fetchPgfTreasury } from "../api/chain";
import { PgfTreasuryResponse } from "../api/chain";

export function usePgfInfo() {
    return useQuery<PgfTreasuryResponse>({
        queryKey: ["pgfTreasury"],
        queryFn: fetchPgfTreasury,
    });
} 