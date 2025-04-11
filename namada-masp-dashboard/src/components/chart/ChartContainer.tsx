import { useState } from "react";
import MaspAggregatesChartContainer from "./maspAggregates/MaspAggregatesChartContainer";
import CustomCheckbox from "../common/CustomCheckbox";
import ErrorBoundary from "../common/ErrorBoundary";
import { useRegistryData } from "../../hooks/useRegistryData";
import MaspTxVolumeChartContainer from "./maspTxVolume/MaspTxVolumeChartContainer";
import MaspBalancesChartContainer from "./maspBalances/MaspBalancesChartContainer";
import IbcAggregatesChartContainer from "./ibcAggregates/IbcAggregatesChartContainer";

interface ChartVisibility {
    maspAggregates: boolean;
    maspTxVolume: boolean;
    maspBalances: boolean;
    ibcAggregates: boolean;
}

function ChartContainer() {
    const [visibility, setVisibility] = useState<ChartVisibility>({
        maspAggregates: true,
        maspTxVolume: true,
        maspBalances: true,
        ibcAggregates: true,
    });

    const toggleChart = (chart: keyof ChartVisibility) => {
        setVisibility((prev) => ({
            ...prev,
            [chart]: !prev[chart],
        }));
    };

    const { assets = [], isLoading: isLoadingRegistry } = useRegistryData();

    return (
        <div className="container-surface mt-8 py-4 px-4">
            <div className="section-heading text-xl md:text-2xl mb-8">Namada Metrics</div>

            {/* Chart Toggles */}
            <div className="flex flex-col gap-4 mb-8">
                <div className="flex flex-wrap items-center gap-3 md:gap-4">
                    <CustomCheckbox
                        checked={visibility.maspAggregates}
                        onChange={() => toggleChart("maspAggregates")}
                        label="MASP Inflow/Outflow"
                        borderColor="grey"
                        checkColor="white"
                    />
                    <CustomCheckbox
                        checked={visibility.maspTxVolume}
                        onChange={() => toggleChart("maspTxVolume")}
                        label="MASP Tx Volume"
                        borderColor="grey"
                        checkColor="white"
                    />
                    <CustomCheckbox
                        checked={visibility.maspBalances}
                        onChange={() => toggleChart("maspBalances")}
                        label="Masp Asset Values"
                        borderColor="grey"
                        checkColor="white"
                    />
                    <CustomCheckbox
                        checked={visibility.ibcAggregates}
                        onChange={() => toggleChart("ibcAggregates")}
                        label="IBC Inflow/Outflow"
                        borderColor="grey"
                        checkColor="white"
                    />
                </div>
                <div className="text-xs text-white/50">Note: All USD values calculated using <span className="text-white">current price</span>, not historical price</div>
            </div>

            {/* Charts */}
            <div className="space-y-24">
                {visibility.maspAggregates && (
                    <ErrorBoundary>
                        <MaspAggregatesChartContainer
                            isLoadingRegistry={isLoadingRegistry}
                            assets={assets}
                        />
                    </ErrorBoundary>
                )}

                {visibility.maspTxVolume && (
                    <ErrorBoundary>
                        <MaspTxVolumeChartContainer
                            isLoading={isLoadingRegistry}
                            assets={assets}
                        />
                    </ErrorBoundary>
                )}

                {visibility.maspBalances && (
                    <ErrorBoundary>
                        <MaspBalancesChartContainer
                            isLoading={isLoadingRegistry}
                            assets={assets}
                        />
                    </ErrorBoundary>
                )}

                {visibility.ibcAggregates && (
                    <ErrorBoundary>
                        <IbcAggregatesChartContainer
                            isLoadingRegistry={isLoadingRegistry}
                            assets={assets}
                        />
                    </ErrorBoundary>
                )}
                {/* Add more charts here as they become available */}
            </div>

            {!visibility.maspAggregates && !visibility.maspTxVolume && !visibility.maspBalances && !visibility.ibcAggregates && (
                <div className="min-h-[300px] flex items-center justify-center text-xl font-light text-white/50">
                    No charts selected
                </div>
            )}
        </div>
    );
}

export default ChartContainer;
