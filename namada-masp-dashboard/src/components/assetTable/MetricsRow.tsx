import { TransformedTokenAmount } from "../../api/chain";
import { useRewardTokens } from "../../hooks/useMaspData";
import { RegistryAsset } from "../../types/chainRegistry";
import { RewardToken, RewardTokensResponse } from "../../types/masp";
import { denomAmount, formatNumber, formatPercentage } from "../../utils/numbers";
import NetChangeSpans from "./NetChangeSpans";

interface MetricsRowProps {
    // viewMode: ViewMode // was used for toggling between 'tabs'
    token: RegistryAsset;
    tokenPrice: number | null;
    maspBalances: TransformedTokenAmount | null;
    transparentBalances: TransformedTokenAmount | null;
    isLoading?: boolean;
}

function MetricsRow({
    token,
    tokenPrice,
    maspBalances,
    transparentBalances,
    isLoading,
}: MetricsRowProps) {
    const { data: rewardTokens } = useRewardTokens();

    if (isLoading) {
        return (
            <div className="p-4">
                <div className="animate-pulse space-y-4">
                    {[...Array(1)].map((_, i) => (
                        <div key={i} className="h-[96px] bg-gray-700 rounded" />
                    ))}
                </div>
            </div>
        );
    }

    // TODO: Add loading state for token supplies, so we can still show the token symbol and icon
    if (!maspBalances || !transparentBalances) {
        return (
            <div className="p-4">
                <div className="animate-pulse space-y-4">
                    {[...Array(1)].map((_, i) => (
                        <div key={i} className="h-[96px] bg-gray-700 rounded" />
                    ))}
                </div>
            </div>
        );
    }

    const rawCurrentMasp = maspBalances.balances.current;
    const denomCurrentMasp = denomAmount(rawCurrentMasp, 6);

    const rawCurrentTransparent = transparentBalances.balances.current;
    const denomCurrentTransparent = denomAmount(rawCurrentTransparent, 6);

    const tokenRewardRate = rewardTokens?.rewardTokens.find((rewardToken) => {
        return rewardToken.address === token.address;
    });
    const ssrEligible = (tokenRewardRate?.max_reward_rate ?? 0) > 0 ? true : false;
    const borderClass = ssrEligible ? "border border-[#FFFF00] border-l-0 " : "";

    return (
        <div className={`h-[94px] p-4 flex items-center bg-[#010101] ${borderClass} rounded-tr-[5px] rounded-br-[5px]`}>
            {/* Shielded Value Column */}
            <div className="flex-1 pl-8">
                <div className="asset-amt-text">
                    {formatNumber(denomCurrentMasp, 2)} {token.symbol}
                </div>
                <div className="asset-amt-usd-text">
                    $
                    {tokenPrice && denomCurrentMasp
                        ? formatNumber(denomCurrentMasp * tokenPrice, 2)
                        : "--"}
                </div>
                <NetChangeSpans changes={maspBalances.balances.changes} />
            </div>

            {/* Transparent Value Column */}
            <div className="flex-1">
                <div className="asset-amt-text">
                    {formatNumber(denomCurrentTransparent, 2)} {token.symbol}
                </div>
                <div className="asset-amt-usd-text">
                    $
                    {tokenPrice && denomCurrentTransparent
                        ? formatNumber(denomCurrentTransparent * tokenPrice, 2)
                        : "--"}
                </div>
                <NetChangeSpans changes={transparentBalances.balances.changes} />
            </div>

            {/* Rewards Param Column */}
            <div className="w-[150px] text-[#FFFF00] flex items-center justify-center">
                {tokenRewardRate?.max_reward_rate
                    ? tokenRewardRate.max_reward_rate == 0
                        ? "--"
                        : `${formatPercentage(tokenRewardRate.max_reward_rate * 100)}`
                    : "--"}
            </div>
        </div>
    );
}

export default MetricsRow;
