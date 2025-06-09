import { formatNumber, denomAmount } from "../../utils/numbers";
import { RegistryAsset } from "../../types/chainRegistry";
import { TransformedTokenAmount } from "../../api/chain";
import NetChangeSpans from "./NetChangeSpans";
import "../../styles/shared.css";
import { useRewardTokens } from "../../hooks/useMaspData";

interface AssetRowProps {
    token: RegistryAsset;
    tokenPrice: number | null;
    maspBalances: TransformedTokenAmount | null;
    isLoading?: boolean;
    trace?: string;
    sortedAssets: RegistryAsset[];
}

function AssetRow({
    token,
    tokenPrice,
    maspBalances,
    isLoading,
    trace,
    sortedAssets,
}: AssetRowProps) {
    if (isLoading) {
        return (
            <div className="animate-pulse space-y-4">
                {[...Array(1)].map((_, i) => (
                    <div key={i} className="h-[94px] bg-gray-800 rounded flex items-center justify-center text-sm">Loading</div>
                ))}
            </div>
        );
    }

    if (!maspBalances) {
        return (
            <div className={`h-[94px] p-4 pr-32 flex gap-12 items-center bg-[#010101] rounded-tl-[5px] rounded-bl-[5px]`}>
                {/* Token Column */}
                <div className="flex items-center space-x-3">
                    {/* Asset Icon with Tooltip */}
                    <div className="relative group">
                        <div className="w-[40px] h-[40px] rounded-full overflow-hidden bg-[#010101] flex-shrink-0">
                            {token.logo_URIs?.svg && (
                                <img
                                    src={token.logo_URIs.svg}
                                    alt={`${token.symbol} logo`}
                                    className="w-[40px] h-[40px] object-cover"
                                    height={40}
                                    width={40}
                                />
                            )}
                        </div>
                        {/* Tooltip */}
                        <div className="absolute left-0 bottom-full mb-2 px-4 py-2 bg-[#222] text-white text-sm rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 whitespace-nowrap">
                            <div className="text-gray-400 ">
                                <div className="mb-1">{token.address}</div>
                                {trace && <div>{trace}</div>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Total Value Column */}
                <div className="flex-1">
                    <div className="asset-amt-text">
                        {token.symbol}
                    </div>
                    <div className="asset-amt-usd-text">
                        $ ---
                    </div>
                </div>
            </div>
        );
    }

    const rawCurrentMasp = maspBalances.balances.current;
    const denomCurrentMasp = denomAmount(rawCurrentMasp, 6);
    const { data: rewardTokens } = useRewardTokens();
    // Uncomment for testing prior to rewards being enabled
    // const rewardTokens = {
    //     rewardTokens: [
    //         {
    //             name: token.symbol,
    //             address: token.address,
    //             max_reward_rate: sortedAssets.indexOf(token) % 3 === 0 ? 0 : 0.05,
    //             kp_gain: 0.1,
    //             kd_gain: 0.1,
    //             locked_amount_target: 250000000000
    //         }
    //     ]
    // };

    const tokenRewardRate = rewardTokens?.rewardTokens.find((rewardToken) => {
        return rewardToken.address === token.address;
    });
    const ssrEligible = (tokenRewardRate?.max_reward_rate ?? 0) > 0 ? true : false;
    const borderClass = ssrEligible ? "border border-[#FFFF00]/70 border-r-0 " : "border border-[#FFFFFF]/30 border-r-0 ";

    return (
        <div className={`h-[94px] p-4 pr-32 flex gap-12 items-center ${borderClass} bg-[#010101] rounded-tl-[5px] rounded-bl-[5px]`}>
            {/* Token Column */}
            <div className="flex items-center space-x-3">
                {/* Asset Icon with Tooltip */}
                <div className="relative group">
                    <div className="w-[40px] h-[40px] rounded-full overflow-hidden bg-[#010101] flex-shrink-0">
                        {token.logo_URIs?.svg && (
                            <img
                                src={token.logo_URIs.svg}
                                alt={`${token.symbol} logo`}
                                className="w-[40px] h-[40px] object-cover"
                                height={40}
                                width={40}
                            />
                        )}
                    </div>
                    {/* Tooltip */}
                    <div className="absolute left-0 bottom-full mb-2 px-4 py-2 bg-[#222] text-white text-sm rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 whitespace-nowrap">
                        <div className="text-gray-400 ">
                            <div className="mb-1">{token.address}</div>
                            {trace && <div>{trace}</div>}
                        </div>
                    </div>
                </div>
            </div>

            {/* Shielded Value Column */}
            <div className="flex-1">
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
        </div>
    );
}

export default AssetRow;
