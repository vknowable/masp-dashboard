import { TransformedTokenAmount } from "../../api/chain";
import { useRewardTokens, useLastInflation } from "../../hooks/useMaspData";
import { RegistryAsset } from "../../types/chainRegistry";
import { denomAmount, formatNumber, formatPercentage } from "../../utils/numbers";
import NetChangeSpans from "./NetChangeSpans";
import { ViewMode } from "./AssetTableContainer";
import { useTokenSupplies } from "../../hooks/useTokenSupplies";
import { useTokenPrices } from "../../hooks/useTokenPrices";

// Helper functions for net changes
const getNetChangeColor = (value: number | null) => {
    if (value === null) return "text-[#B9B9B9]";
    return value >= 0 ? "text-[#00FF00]" : "text-[#FF0000]";
};

const formatNetChange = (value: string | null) => {
    if (value === null) return "--";
    const num = parseFloat(value);
    return num >= 0 ? `+${num.toFixed(2)}%` : `${num.toFixed(2)}%`;
};

interface MetricsRowProps {
    token: RegistryAsset;
    tokenPrice: number | null;
    maspBalances: TransformedTokenAmount | null;
    transparentBalances: TransformedTokenAmount | null;
    isLoading?: boolean;
    viewMode: ViewMode;
    sortedAssets: RegistryAsset[];
}

function MetricsRow({
    token,
    tokenPrice,
    maspBalances,
    transparentBalances,
    isLoading,
    viewMode,
    sortedAssets,
}: MetricsRowProps) {
    // const { data: rewardTokens } = useRewardTokens();
    // Uncomment for testing prior to rewards being enabled
    const rewardTokens = {
        rewardTokens: [
            {
                name: token.symbol,
                address: token.address,
                max_reward_rate: 0.05,
                kp_gain: 0.1,
                kd_gain: 0.1,
                locked_amount_target: 250000000000
            }
        ]
    };
    const { data: tokenSupplies } = useTokenSupplies();
    const { data: tokenPrices } = useTokenPrices();
    const { data: lastInflation } = useLastInflation();

    if (isLoading) {
        return (
            <div className="animate-pulse space-y-4">
                {[...Array(1)].map((_, i) => (
                    <div key={i} className="h-[94px] bg-gray-800 rounded flex items-center justify-center text-sm">Loading</div>
                ))}
            </div>
        );
    }

    if (!maspBalances && !transparentBalances) {
        return (
            <div className="space-y-4">
                {[...Array(1)].map((_, i) => (
                    <div key={i} className="h-[94px] bg-gray-800 rounded flex items-center justify-center text-sm">Data not available</div>
                ))}
            </div>
        );
    }

    const rawCurrentMasp = maspBalances?.balances.current;
    const denomCurrentMasp = denomAmount(rawCurrentMasp, 6);

    const rawCurrentTransparent = transparentBalances?.balances.current;
    const denomCurrentTransparent = denomAmount(rawCurrentTransparent, 6);

    const tokenRewardRate = rewardTokens?.rewardTokens.find((rewardToken) => {
        return rewardToken.address === token.address;
    });
    const ssrEligible = (tokenRewardRate?.max_reward_rate ?? 0) > 0 ? true : false;
    const borderClass = ssrEligible ? "border border-[#FFFF00] border-l-0 " : "";

    if (viewMode === 'shielded') {
        const rawTargetAmount = tokenRewardRate?.locked_amount_target;
        const decimals = token.denom_units.find(unit => unit.denom === token.display)?.exponent ?? 6;
        const denomTargetAmount = rawTargetAmount === 0 ? null : denomAmount(rawTargetAmount, decimals);

        const percentageOfTarget = denomTargetAmount && denomCurrentMasp
            ? (denomCurrentMasp / denomTargetAmount) * 100
            : null;

        // Calculate historical percentages using historical balances
        const balances = maspBalances?.balances;
        const historicalPercentages = {
            "24h Ago": balances && balances["1dAgo"] && rawTargetAmount
                ? Math.round(balances["1dAgo"] / rawTargetAmount * 100)
                : null,
            "7d Ago": balances && balances["7dAgo"] && rawTargetAmount
                ? Math.round(balances["7dAgo"] / rawTargetAmount * 100)
                : null,
            "30d Ago": balances && balances["30dAgo"] && rawTargetAmount
                ? Math.round(balances["30dAgo"] / rawTargetAmount * 100)
                : null
        };

        // Get NAM token info for rewards
        const namToken = sortedAssets.find(asset => asset.symbol === "NAM");
        const namDecimals = namToken?.denom_units.find(unit => unit.denom === namToken.display)?.exponent ?? 6;
        const namPrice = tokenPrices?.price.find(entry => entry.id === namToken?.coingecko_id)?.usd ?? null;

        // Get last inflation for this token
        const inflationData = lastInflation?.data?.find(infl => infl.address === token.address);
        const lastInflationAmount = inflationData?.last_inflation;
        const denomLastInflation = lastInflationAmount ? denomAmount(lastInflationAmount, namDecimals) : null;

        // Get historical inflation data
        const historicalInflation = {
            "24h Ago": inflationData?.historical_inflation?.["1dAgo"] ? denomAmount(inflationData.historical_inflation["1dAgo"], namDecimals) : null,
            "7d Ago": inflationData?.historical_inflation?.["7dAgo"] ? denomAmount(inflationData.historical_inflation["7dAgo"], namDecimals) : null,
            "30d Ago": inflationData?.historical_inflation?.["30dAgo"] ? denomAmount(inflationData.historical_inflation["30dAgo"], namDecimals) : null
        };

        return (
            <div className={`h-[94px] p-4 flex items-center bg-[#010101] ${borderClass} rounded-tr-[5px] rounded-br-[5px]`}>
                {/* Target MASP Amount Column */}
                <div className="flex-1 pl-8">
                    {ssrEligible ? (
                        <>
                            <div className="asset-amt-text">
                                {formatNumber(denomTargetAmount ?? 0, 2)} {token.symbol}
                                {percentageOfTarget !== null && (
                                    <span className="asset-amt-usd-text ml-2">
                                        ({formatNumber(percentageOfTarget, 0)}%)
                                    </span>
                                )}
                            </div>
                            <div className="asset-amt-usd-text">
                                $
                                {tokenPrice && denomTargetAmount
                                    ? formatNumber(denomTargetAmount * tokenPrice, 2)
                                    : "--"}
                            </div>
                            {percentageOfTarget !== null && (
                                <div className="flex gap-4 asset-change-text">
                                    {Object.entries(historicalPercentages).map(([period, value]) => (
                                        <div key={period} className="flex">
                                            <div className="text-[#B9B9B9]">
                                                <span>
                                                    {value ?? "--"}
                                                </span>%
                                                <span className="ml-1">({period})</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="asset-amt-text text-[#B9B9B9]">N/A</div>
                    )}
                </div>

                {/* 24h Rewards Column */}
                <div className="flex-1">
                    {ssrEligible ? (
                        <>
                            <div className="asset-amt-text">
                                {denomLastInflation !== null ? formatNumber(denomLastInflation, 2) : "--"} NAM
                            </div>
                            <div className="asset-amt-usd-text">
                                $
                                {namPrice && denomLastInflation !== null
                                    ? formatNumber(denomLastInflation * namPrice, 2)
                                    : "--"}
                            </div>
                            {Object.values(historicalInflation).some(value => value !== null) && (
                                <div className="flex gap-4 asset-change-text">
                                    {Object.entries(historicalInflation).map(([period, value]) => (
                                        <div key={period} className="flex">
                                            <div className="text-[#B9B9B9]">
                                                <span>
                                                    {value !== null ? formatNumber(value, 2) : "--"}
                                                </span>
                                                <span className="ml-1">({period})</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="asset-amt-text text-[#B9B9B9]">N/A</div>
                    )}
                </div>

                {/* Rewards Rate Column */}
                <div className="w-[150px] text-[#FFFF00] flex items-center justify-center">
                    {ssrEligible ? (
                        tokenRewardRate?.max_reward_rate !== undefined
                            ? `${formatPercentage(tokenRewardRate.max_reward_rate * 100)}`
                            : "--"
                    ) : (
                        "N/A"
                    )}
                </div>
            </div>
        );
    } else {
        const tokenSupply = tokenSupplies?.supplies.find(
            (entry) => entry.address === token.address
        );
        const rawTotalSupply = tokenSupply?.supplies.current;
        const denomTotalSupply = denomAmount(rawTotalSupply, 6);

        return (
            <div className={`h-[94px] p-4 flex items-center bg-[#010101] ${borderClass} rounded-tr-[5px] rounded-br-[5px]`}>
                {/* Transparent Value Column */}
                <div className="flex-1 pl-8">
                    <div className="asset-amt-text">
                        {formatNumber(denomCurrentTransparent, 2)} {token.symbol}
                    </div>
                    <div className="asset-amt-usd-text">
                        $
                        {tokenPrice && denomCurrentTransparent
                            ? formatNumber(denomCurrentTransparent * tokenPrice, 2)
                            : "--"}
                    </div>
                    {transparentBalances && <NetChangeSpans changes={transparentBalances.balances.changes} />}
                </div>

                {/* Total Value Column */}
                <div className="flex-1">
                    <div className="asset-amt-text">
                        {formatNumber(denomTotalSupply, 2)} {token.symbol}
                    </div>
                    <div className="asset-amt-usd-text">
                        $
                        {tokenPrice && denomTotalSupply
                            ? formatNumber(denomTotalSupply * tokenPrice, 2)
                            : "--"}
                    </div>
                    {tokenSupply && <NetChangeSpans changes={tokenSupply.supplies.changes} />}
                </div>
            </div>
        );
    }
}

export default MetricsRow;
