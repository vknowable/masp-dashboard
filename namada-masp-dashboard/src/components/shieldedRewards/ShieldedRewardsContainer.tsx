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
import { useMaspAggregates } from "../../hooks/useMaspAggregates";

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
    const { data: maspAggregates } = useMaspAggregates();

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

    // Calculate Historical Total Value Shielded
    const calculateHistoricalTotalValue = (): number | null => {
        if (!maspAggregates || !assets || !tokenPrices?.price) {
            return null;
        }

        // Get all-time inflow data
        const allTimeInflows = maspAggregates.filter(
            (aggregate) => aggregate.timeWindow === 'allTime' && aggregate.kind === 'inflows'
        );

        let totalHistoricalValueUsd = 0;

        // Sum up USD values for each asset
        for (const inflow of allTimeInflows) {
            // Find the corresponding asset to get decimals and coingecko_id
            const asset = assets.find((a) => a.address === inflow.tokenAddress);
            if (!asset) continue;

            // Get token price from coingecko
            const tokenPrice = tokenPrices.price.find((p) => p.id === asset.coingecko_id);
            if (!tokenPrice) continue;

            // Get the correct decimals for the token
            const decimals = asset.denom_units?.find((unit) => unit.denom === asset.display)?.exponent ?? 6;

            // Convert raw amount to human-readable amount
            const denomInflowAmount = denomAmount(parseFloat(inflow.totalAmount), decimals);
            if (denomInflowAmount === null) continue;

            // Calculate USD value
            const usdValue = denomInflowAmount * tokenPrice.usd;
            totalHistoricalValueUsd += usdValue;
        }

        return totalHistoricalValueUsd;
    };

    const historicalTotalValue = calculateHistoricalTotalValue();

    // Calculate Current Value Breakdown (Native vs Non-Native)
    const calculateCurrentValueBreakdown = (): { native: number | null; nonNative: number | null } => {
        if (!maspBalances?.balances || !assets || !tokenPrices?.price || !namToken) {
            return { native: null, nonNative: null };
        }

        let nativeValueUsd = 0;
        let nonNativeValueUsd = 0;

        for (const balance of maspBalances.balances) {
            const asset = assets.find((a) => a.address === balance.tokenAddress);
            if (!asset || !balance.balances.current) continue;

            const tokenPrice = tokenPrices.price.find((p) => p.id === asset.coingecko_id);
            if (!tokenPrice) continue;

            const decimals = asset.denom_units?.find((unit) => unit.denom === asset.display)?.exponent ?? 6;
            const denomBalanceAmount = denomAmount(balance.balances.current, decimals);
            if (denomBalanceAmount === null) continue;

            const usdValue = denomBalanceAmount * tokenPrice.usd;

            if (asset.address === namToken.address) {
                nativeValueUsd += usdValue;
            } else {
                nonNativeValueUsd += usdValue;
            }
        }

        return { native: nativeValueUsd, nonNative: nonNativeValueUsd };
    };

    // Calculate Historical Value Breakdown (Native vs Non-Native)
    const calculateHistoricalValueBreakdown = (): { native: number | null; nonNative: number | null } => {
        if (!maspAggregates || !assets || !tokenPrices?.price || !namToken) {
            return { native: null, nonNative: null };
        }

        const allTimeInflows = maspAggregates.filter(
            (aggregate) => aggregate.timeWindow === 'allTime' && aggregate.kind === 'inflows'
        );

        let nativeValueUsd = 0;
        let nonNativeValueUsd = 0;

        for (const inflow of allTimeInflows) {
            const asset = assets.find((a) => a.address === inflow.tokenAddress);
            if (!asset) continue;

            const tokenPrice = tokenPrices.price.find((p) => p.id === asset.coingecko_id);
            if (!tokenPrice) continue;

            const decimals = asset.denom_units?.find((unit) => unit.denom === asset.display)?.exponent ?? 6;
            const denomInflowAmount = denomAmount(parseFloat(inflow.totalAmount), decimals);
            if (denomInflowAmount === null) continue;

            const usdValue = denomInflowAmount * tokenPrice.usd;

            if (asset.address === namToken.address) {
                nativeValueUsd += usdValue;
            } else {
                nonNativeValueUsd += usdValue;
            }
        }

        return { native: nativeValueUsd, nonNative: nonNativeValueUsd };
    };

    const currentValueBreakdown = calculateCurrentValueBreakdown();
    const historicalValueBreakdown = calculateHistoricalValueBreakdown();

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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
                    <InfoCardSecondary
                        topText="Current Value Shielded"
                        bottomText={
                            <div className="flex flex-col">
                                <div className="flex items-baseline gap-2">
                                    <div className="text-lg font-bold">
                                        {currentValueBreakdown.nonNative !== null
                                            ? `$${formatNumber(currentValueBreakdown.nonNative)} USD`
                                            : "--"}
                                    </div>
                                    <div className="text-sm" style={{ color: '#FFFF00' }}>(non-native)</div>
                                </div>
                                <div className="flex flex-col mt-1" style={{ color: '#FFFF00', opacity: 0.8 }}>
                                    <div className="text-sm">
                                        {currentValueBreakdown.native !== null
                                            ? `$${formatNumber(currentValueBreakdown.native)} USD (NAM)`
                                            : "-- (NAM)"}
                                    </div>
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
                        topText="Historical Value Shielded"
                        bottomText={
                            <div className="flex flex-col">
                                <div className="flex items-baseline gap-2">
                                    <div className="text-lg font-bold">
                                        {historicalValueBreakdown.nonNative !== null
                                            ? `$${formatNumber(historicalValueBreakdown.nonNative)} USD`
                                            : "--"}
                                    </div>
                                    <div className="text-sm" style={{ color: '#FFFF00' }}>(non-native)</div>
                                </div>
                                <div className="flex flex-col mt-1" style={{ color: '#FFFF00', opacity: 0.8 }}>
                                    <div className="text-sm">
                                        {historicalValueBreakdown.native !== null
                                            ? `$${formatNumber(historicalValueBreakdown.native)} USD (NAM)`
                                            : "-- (NAM)"}
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
                        bottomText={metrics.rewardsPerEpoch ? `${formatNumber(metrics.rewardsPerEpoch)} NAM` : "--"}
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
                        bottomText={
                            <div className="flex flex-col">
                                <div className="text-lg font-bold">
                                    {metrics.txCount ? formatNumber(metrics.txCount, 0) : "--"}
                                </div>
                                <div className="text-sm text-gray-500 mt-1">
                                    {metrics.feesCollected ? `$${formatNumber(metrics.feesCollected, 2)} USD fees collected` : ""}
                                </div>
                            </div>
                        }
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