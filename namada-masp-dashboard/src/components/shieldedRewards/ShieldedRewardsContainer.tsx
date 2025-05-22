import ErrorBoundary from "../common/ErrorBoundary";
import InfoCardSecondary from "../infoGrid/InfoCardSecondary";
import { useChainInfo } from "../../hooks/useChainInfo";
import { formatNumber, formatPercentage, denomAmount } from "../../utils/numbers";
import { useLastInflation } from "../../hooks/useMaspData";
import { NATIVE_NAM_ADDRESS } from "../../utils/nativeAddress";
import { useTokenList } from "../../hooks/useTokenList";
import { IbcToken } from "../../types/token";

function calculatePercentChange(change: number | null, current: number | null): string | null {
    if (change === null || current === null) return null;

    const divisor = current - change;
    if (divisor === 0) return null;

    const percent = ((change / divisor) * 100);
    // clip the allowed output; if we end up with such large number, it's probably because of a
    // divide by almost-not-quite-zero situation
    return Math.abs(percent) > 10000 ? null :
        percent >= 0 ? `+${percent.toFixed(2)}` : percent.toFixed(2);
}

function ShieldedRewardsContainer() {
    const { metrics } = useChainInfo();
    const { data: lastInflation } = useLastInflation();
    const { data: tokenList } = useTokenList();
    const nativeInflationData = lastInflation?.data?.find(
        (item) => item.address === NATIVE_NAM_ADDRESS
    );

    const totalShieldedAssets = metrics.totalShieldedAssets;
    const { current, changes } = totalShieldedAssets ?? {};

    const ibcAssetsCount = tokenList?.filter((token): token is IbcToken => 'trace' in token).length ?? 0;

    return (
        <div className="pb-8 pt-4 px-4 mt-8 h-full w-full">
            <div className="section-heading text-xl md:text-2xl mb-8">Shielded Rewards</div>
            <ErrorBoundary>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <InfoCardSecondary
                        topText="Total Value Shielded"
                        bottomText={
                            <div className="flex flex-col">
                                <div className="text-lg font-bold">
                                    ${formatNumber(current)}
                                </div>
                                <div className="flex flex-row mt-2">
                                    <div className="text-sm text-gray-500 mr-3">
                                        {calculatePercentChange(changes?.["24h"] ?? null, current ?? null)}%{" "}
                                        (24h)
                                    </div>
                                    <div className="text-sm text-gray-500 mr-3">
                                        {calculatePercentChange(changes?.["7d"] ?? null, current ?? null)}%{" "}
                                        (7d)
                                    </div>
                                    <div className="text-sm text-gray-500 mr-3">
                                        {calculatePercentChange(changes?.["30d"] ?? null, current ?? null)}%{" "}
                                        (30d)
                                    </div>
                                </div>
                            </div>
                        }
                    />
                    <InfoCardSecondary
                        topText="24h NAM Rewards"
                        bottomText={metrics.rewardsPerEpoch ? `${formatNumber(denomAmount(metrics.rewardsPerEpoch))} NAM` : "--"}
                    />
                    <InfoCardSecondary
                        topText="Total Inflation Rate"
                        bottomText={nativeInflationData ? `${nativeInflationData.last_inflation}%` : "--"}
                    />
                    <InfoCardSecondary
                        topText="IBC Assets"
                        bottomText={formatNumber(ibcAssetsCount, 0)}
                    />
                    <InfoCardSecondary
                        topText="Rewards Minted to Date (NAM)"
                        bottomText={`${formatNumber(denomAmount(metrics.totalRewardsMinted))} NAM`}
                    />
                    <InfoCardSecondary
                        topText="MASP Transactions to Date"
                        bottomText={metrics.maspTxCount ? formatNumber(metrics.maspTxCount, 0) : "--"}
                    />
                </div>
            </ErrorBoundary>
        </div>
    );
}

export default ShieldedRewardsContainer;