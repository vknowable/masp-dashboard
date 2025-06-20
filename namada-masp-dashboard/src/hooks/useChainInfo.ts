import { useQuery } from "@tanstack/react-query";
import {
    fetchChainParameters,
    fetchLatestBlock,
    fetchVotingPower,
    fetchLatestEpoch,
    fetchTotalRewards,
    fetchTxCount,
    TransformedTokenAmounts,
    TokenPricesResponse,
} from "../api/chain";
import { denomAmount, parseNumeric } from "../utils/numbers";
import { BlockHeight } from "../api/chain";
import { retryPolicy, retryDelay } from "../api/apiClient";
import { useRegistryData } from "./useRegistryData";
import { useTokenSupplies } from "./useTokenSupplies";
import { useTokenPrices } from "./useTokenPrices";
import { useMaspBalances } from "./useMaspBalances";
import { RegistryAsset } from "../types/chainRegistry";
import { useMaspTxCount, useLastInflation } from "./useMaspData";

interface ShieldedAssetsMetrics {
    current: number | null;
    changes: {
        "24h": number | null;
        "7d": number | null;
        "30d": number | null;
    };
}

export interface ChainMetrics {
    blockTime: number | null;
    blockHeight: number | null;
    stakingApr: number | null;
    totalSupply: number | null;
    totalStaked: string | null;
    percentStaked: number | null;
    totalShieldedAssets: ShieldedAssetsMetrics | null;
    totalRewardsMinted: number | null;
    rewardsPerEpoch: number | null;
    epoch: string | null;
    maspTxCount: number | null;
    txCount: number | null;
    addressCount: number | null;
    chainId: string | null;
}

export interface ChainInfo {
    metrics: ChainMetrics;
    isLoading: boolean;
    isError: boolean;
}

// Calculate average time between blocks in seconds
function calculateAverageBlockTime(
    blocks: { header: { time: string } }[]
): number | null {
    if (blocks.length < 2) return null;
    // Sort blocks by timestamp to ensure correct order
    const sortedBlocks = [...blocks].sort(
        (a, b) =>
            new Date(a.header.time).getTime() - new Date(b.header.time).getTime()
    );
    let totalDiff = 0;
    for (let i = 1; i < sortedBlocks.length; i++) {
        const curr = new Date(sortedBlocks[i].header.time).getTime();
        const prev = new Date(sortedBlocks[i - 1].header.time).getTime();
        totalDiff += curr - prev;
    }
    // Convert from milliseconds to seconds and return average
    return totalDiff / (1000 * (sortedBlocks.length - 1));
}

// Calculate staked percentage safely
const calculateStakedPercentage = (
    totalStaked: string | null,
    totalSupply: number | null
): number | null => {
    if (!totalStaked || !totalSupply) return null;
    const parsedStaked = parseFloat(totalStaked); // already denominated in NAM
    const parsedTotal = denomAmount(totalSupply);
    if (!parsedTotal || isNaN(parsedTotal) || parsedTotal === 0) {
        return null;
    }
    return (parsedStaked / parsedTotal) * 100;
};

// Tally up the total shielded assets in USD
const calculateTotalShieldedAssets = (
    maspBalances: TransformedTokenAmounts,
    tokenPrices: TokenPricesResponse,
    assetMetadata: RegistryAsset[]
): ShieldedAssetsMetrics => {
    if (!maspBalances?.balances || !tokenPrices?.price || !assetMetadata) {
        return {
            current: null,
            changes: {
                "24h": null,
                "7d": null,
                "30d": null,
            },
        };
    }

    const initialMetrics = {
        current: 0,
        changes: {
            "24h": 0,
            "7d": 0,
            "30d": 0,
        },
    };

    return maspBalances.balances.reduce((total, balance) => {
        const metadata = assetMetadata.find(
            (asset) => asset.address === balance.tokenAddress
        );
        const exponent =
            metadata?.denom_units?.find((unit) => unit.denom === metadata.display)
                ?.exponent ?? 6;
        if (!metadata?.coingecko_id || !exponent) {
            return total;
        }

        const price = tokenPrices.price.find(
            (p) => p.id === metadata.coingecko_id
        )?.usd;
        if (!price) {
            return total;
        }

        // Calculate USD value of changes
        const changes24h = denomAmount(balance.balances.changes["24h"], exponent);
        const changes7d = denomAmount(balance.balances.changes["7d"], exponent);
        const changes30d = denomAmount(balance.balances.changes["30d"], exponent);
        const currentBalance = denomAmount(balance.balances.current, exponent);

        if (!currentBalance) return total;

        return {
            current: total.current + currentBalance * price,
            changes: {
                "24h": total.changes["24h"] + (changes24h ? changes24h * price : 0),
                "7d": total.changes["7d"] + (changes7d ? changes7d * price : 0),
                "30d": total.changes["30d"] + (changes30d ? changes30d * price : 0),
            },
        };
    }, initialMetrics);
};

export function useChainInfo(): ChainInfo {
    const { assets, isLoading: isLoadingRegistry } = useRegistryData();
    const { data: tokenPrices, isLoading: isLoadingPrices } = useTokenPrices();
    const { data: tokenSupplies, isLoading: isLoadingSupplies } =
        useTokenSupplies();
    const { data: maspBalances, isLoading: isLoadingMaspBalances } =
        useMaspBalances();
    const { data: maspTxCount, isLoading: isLoadingMaspTxCount } = useMaspTxCount();
    const { data: lastInflation, isLoading: isLoadingLastInflation } = useLastInflation();

    // Get chain parameters (includes APR and native token address)
    const {
        data: parameters,
        isLoading: isLoadingParams,
        error: paramsError,
    } = useQuery({
        queryKey: ["chainParameters"],
        queryFn: fetchChainParameters,
        staleTime: 300000, // Consider fresh for 5 minutes
    });

    // Get latest block height
    const { data: blockInfo, isLoading: isLoadingBlock } = useQuery<BlockHeight>({
        queryKey: ["latestBlock"],
        queryFn: fetchLatestBlock,
        refetchInterval: 6000, // Refresh every 6 seconds
    });

    // Get block time calculation data - separate from block height updates
    // No longer used, but kept for reference
    // const { data: blockchainInfo, isLoading: isLoadingBlockchain } = useQuery({
    //     queryKey: ["blockchain"],
    //     queryFn: async () => {
    //         const latest = await fetchLatestBlock();
    //         if (!latest?.block) {
    //             throw new Error("Latest block height not available");
    //         }
    //         const latestHeight = parseInt(latest.block);
    //         return fetchBlockchainInfo(latestHeight - 5, latestHeight);
    //     },
    //     refetchInterval: 30000, // Refresh every 30 seconds (less frequent than block height)
    // });

    // Get total voting power (total staked)
    const { data: votingPower, isLoading: isLoadingVotingPower } = useQuery({
        queryKey: ["votingPower"],
        queryFn: fetchVotingPower,
        retry: retryPolicy,
        retryDelay: retryDelay,
        staleTime: 60000, // Consider fresh for 1 minute
    });

    // Get total rewards minted
    const { data: totalRewards, isLoading: isLoadingRewards } = useQuery({
        queryKey: ["totalRewardsMinted"],
        queryFn: fetchTotalRewards,
        retry: retryPolicy,
        retryDelay: retryDelay,
        staleTime: 60000, // Consider fresh for 1 minute
    });

    // Get latest epoch
    const { data: epochInfo, isLoading: isLoadingEpoch } = useQuery({
        queryKey: ["latestEpoch"],
        queryFn: fetchLatestEpoch,
        retry: retryPolicy,
        retryDelay: retryDelay,
        staleTime: 60000, // Consider fresh for 1 minute
    });

    // Get transaction/address count
    const { data: txCount, isLoading: isLoadingTxCount } = useQuery({
        queryKey: ["txCount"],
        queryFn: fetchTxCount,
        retry: retryPolicy,
        retryDelay: retryDelay,
        staleTime: 60000, // Consider fresh for 1 minute
    });

    // Calculate block time from the last 5 blocks
    // const blockTime = blockchainInfo?.result.block_metas
    //     ? calculateAverageBlockTime(blockchainInfo.result.block_metas)
    //     : null;

    const totalSupply =
        tokenSupplies?.supplies.find(
            (supply) => supply.address === parameters?.nativeTokenAddress
        )?.supplies.current || null;
    const percentStaked = calculateStakedPercentage(
        votingPower?.totalVotingPower ?? null,
        totalSupply
    );
    const totalShieldedAssets = calculateTotalShieldedAssets(
        maspBalances ?? { balances: [] },
        tokenPrices ?? { price: [] },
        assets ?? []
    );
    const maspTxs = maspTxCount ? maspTxCount?.shielding_transfer + maspTxCount?.unshielding_transfer
        + maspTxCount?.shielded_transfer + maspTxCount?.ibc_shielding_transfer + maspTxCount?.ibc_unshielding_transfer
        : null;

    // Calculate 24h NAM rewards by summing last_inflation values
    const namToken = assets?.find(asset => asset.symbol === 'NAM');
    const namDecimals = namToken && namToken.denom_units ?
        namToken.denom_units.find(unit => unit.denom === namToken.display)?.exponent ?? 6
        : 6;
    const rewardsPerEpoch = lastInflation?.data?.reduce((total, token) => {
        if (!token.last_inflation) return total;
        return total + (denomAmount(token.last_inflation as string, namDecimals) ?? 0);
    }, 0) ?? null;

    return {
        metrics: {
            blockTime: null,
            blockHeight: parseNumeric(blockInfo?.block),
            stakingApr: parseNumeric(parameters?.apr),
            totalSupply,
            totalStaked: votingPower?.totalVotingPower ?? null,
            percentStaked,
            totalShieldedAssets,
            totalRewardsMinted: parseNumeric(totalRewards?.totalRewards),
            rewardsPerEpoch,
            epoch: epochInfo?.epoch ?? null,
            maspTxCount: maspTxs,
            txCount: txCount?.count ?? null,
            addressCount: txCount?.unique_addresses ?? null,
            chainId: parameters?.chainId ?? null,
        },
        isLoading: isLoadingParams || isLoadingLastInflation,
        isError: paramsError !== null,
    };
}
