import ErrorBoundary from "../common/ErrorBoundary";
import InfoCardSecondary from "../infoGrid/InfoCardSecondary";
import { useChainInfo } from "../../hooks/useChainInfo";
import { formatNumber, formatPercentage, denomAmount } from "../../utils/numbers";
import { useLastInflation } from "../../hooks/useMaspData";
import { NATIVE_NAM_ADDRESS } from "../../utils/nativeAddress";
import { useTokenList } from "../../hooks/useTokenList";
import { IbcToken } from "../../types/token";
import { useRegistryData } from "../../hooks/useRegistryData";
import { useMaspBalances } from "../../hooks/useMaspBalances";
import { useTokenSupplies } from "../../hooks/useTokenSupplies";
import { useTokenPrices } from "../../hooks/useTokenPrices";

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
    const { assets } = useRegistryData();
    const { data: maspBalances } = useMaspBalances();
    const { data: tokenSupplies } = useTokenSupplies();
    const { data: tokenPrices } = useTokenPrices();

    const nativeInflationData = lastInflation?.data?.find(
        (item) => item.address === NATIVE_NAM_ADDRESS
    );

    // Find native NAM token from registry assets where display == 'nam'
    const namToken = assets?.find((asset) => asset.display.toLowerCase() === 'nam');

    // Calculate total shielded inflation rate
    const calculateTotalShieldedInflationRate = (): string | null => {
        if (!lastInflation?.data || !namToken || !tokenSupplies?.supplies) {
            return null;
        }

        // Sum all last_inflation values across all tokens (shielded rewards inflation)
        const totalShieldedInflation = lastInflation.data.reduce((sum, tokenData) => {
            if (!tokenData.last_inflation) return sum;
            return sum + parseFloat(tokenData.last_inflation);
        }, 0);

        // Get native token total supply
        const namSupplyData = tokenSupplies.supplies.find(
            (supply) => supply.address === namToken.address
        );

        if (!namSupplyData?.supplies.current) {
            return null;
        }

        const namTotalSupply = namSupplyData.supplies.current;

        // Calculate: (total_shielded_inflation / native_total_supply) * 365 * 100
        const annualizedShieldedInflationRate = (totalShieldedInflation / namTotalSupply) * 365 * 100;

        return annualizedShieldedInflationRate.toFixed(2);
    };

    const totalShieldedInflationRate = calculateTotalShieldedInflationRate();

    const totalShieldedAssets = metrics.totalShieldedAssets;
    const { current, changes } = totalShieldedAssets ?? {};

    const ibcAssetsCount = tokenList?.filter((token): token is IbcToken => 'trace' in token).length ?? 0;

    // Find USDC token from registry assets where display == 'usdc'
    // const usdcToken = assets?.find((asset) => asset.display.toLowerCase() === 'usdc');

    // Get USDC shielded and total values
    // const usdcShieldedBalance = usdcToken
    //     ? maspBalances?.balances.find((balance) => balance.tokenAddress === usdcToken.address)?.balances.current
    //     : null;

    // const usdcTotalSupply = usdcToken
    //     ? tokenSupplies?.supplies.find((supply) => supply.address === usdcToken.address)?.supplies.current
    //     : null;

    // Get USDC token decimals for proper formatting
    // const usdcDecimals = usdcToken?.denom_units?.find((unit) => unit.denom === usdcToken.display)?.exponent ?? 6;

    // Convert raw amounts to human-readable amounts
    // const denomUsdcShielded = usdcShieldedBalance ? denomAmount(usdcShieldedBalance, usdcDecimals) : null;
    // const denomUsdcTotal = usdcTotalSupply ? denomAmount(usdcTotalSupply, usdcDecimals) : null;

    // Format USDC display text as dollar amounts
    // const usdcDisplayText = denomUsdcShielded !== null && denomUsdcTotal !== null
    //     ? (
    //         <div className="flex flex-col">
    //             <div className="text-lg font-bold text-[#FFFF00]">
    //                 ${denomUsdcShielded.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
    //             </div>
    //             <div className="text-sm text-gray-500 mt-1">
    //                 Total: ${denomUsdcTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
    //             </div>
    //         </div>
    //     )
    //     : "--";

    return (
        <div className="pb-8 pt-4 px-4 mt-8 h-full w-full">
            <div className="section-heading text-xl md:text-2xl mb-8">Shielded Pool Metrics</div>
            <ErrorBoundary>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <InfoCardSecondary
                        topText="Total Value Shielded"
                        bottomText={
                            <div className="flex flex-col">
                                <div className="text-lg font-bold">
                                    ${formatNumber(current)} USD
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
                    {/* <InfoCardSecondary
                        topText="USDC Value Shielded"
                        bottomText={"--"}
                    /> */}
                    <InfoCardSecondary
                        topText="24h Shielded Rewards"
                        bottomText={metrics.rewardsPerEpoch ? `${formatNumber(denomAmount(metrics.rewardsPerEpoch))} NAM` : "--"}
                    />
                    <InfoCardSecondary
                        topText="Rewards Minted to Date"
                        bottomText={`${formatNumber(denomAmount(metrics.totalRewardsMinted))} NAM`}
                    />
                    <InfoCardSecondary
                        topText="IBC Assets"
                        bottomText={formatNumber(ibcAssetsCount, 0)}
                    />
                    <InfoCardSecondary
                        topText="Total Shielded Inflation Rate"
                        bottomText={totalShieldedInflationRate ? `${totalShieldedInflationRate}%` : "--"}
                    />
                    <InfoCardSecondary
                        topText="Shielded Transactions to Date"
                        bottomText={metrics.maspTxCount ? formatNumber(metrics.maspTxCount, 0) : "--"}
                    />
                    <InfoCardSecondary
                        topText="Total Transactions to Date"
                        bottomText={metrics.maspTxCount ? formatNumber(metrics.txCount, 0) : "--"}
                    />
                    <InfoCardSecondary
                        topText="Unique Addresses"
                        bottomText={metrics.maspTxCount ? formatNumber(metrics.addressCount, 0) : "--"}
                    />
                </div>
            </ErrorBoundary>
        </div>
    );
}

export default ShieldedRewardsContainer;