import { useState } from "react";
import MaspAggregatesChartContainer, {
    MaspAggregatesWindow,
} from "./maspAggregates/MaspAggregatesChartContainer";
import CustomCheckbox from "../common/CustomCheckbox";
import ErrorBoundary from "../common/ErrorBoundary";
import { useRegistryData } from "../../hooks/useRegistryData";
import MaspAggregatesChartTopBar from "./maspAggregates/MaspAggregatesChartTopBar";
import MaspTxVolumeChartContainer from "./maspTxVolume/MaspTxVolumeChartContainer";

interface ChartVisibility {
    maspAggregates: boolean;
    maspTxVolume: boolean;
    anotherChart2: boolean;
    // Add more charts here as they become available
    // tokenPrices: boolean
    // stakingMetrics: boolean
}

function ChartContainer() {
    const [visibility, setVisibility] = useState<ChartVisibility>({
        maspAggregates: true,
        maspTxVolume: true,
        anotherChart2: false,
        // tokenPrices: true,
        // stakingMetrics: true
    });

    const toggleChart = (chart: keyof ChartVisibility) => {
        setVisibility((prev) => ({
            ...prev,
            [chart]: !prev[chart],
        }));
    };

    const [selectedAsset, setSelectedAsset] = useState<string>("All");
    const [selectedTimeframe, setSelectedTimeframe] =
        useState<MaspAggregatesWindow>("24hr");
    const [showShieldedInflow, setShowShieldedInflow] = useState(true);
    const [showShieldedOutflow, setShowShieldedOutflow] = useState(true);
    const { assets = [], isLoading: isLoadingRegistry } = useRegistryData();

    return (
        <div className="container-surface mt-8 py-4 px-4">
            <div className="section-heading text-xl md:text-2xl">Namada Metrics</div>
            {/* Chart Toggles */}
            <div className="flex flex-col gap-6">
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
                        checked={visibility.anotherChart2}
                        onChange={() => toggleChart("anotherChart2")}
                        label="Another Chart 2"
                        borderColor="grey"
                        checkColor="white"
                    />
                </div>

                {visibility.maspAggregates && (
                    <div className="flex flex-col w-full">
                        <MaspAggregatesChartTopBar
                            selectedAsset={selectedAsset}
                            onAssetSelect={setSelectedAsset}
                            selectedTimeframe={selectedTimeframe}
                            onTimeframeSelect={setSelectedTimeframe}
                            showShieldedInflow={showShieldedInflow}
                            onShieldedInflowToggle={setShowShieldedInflow}
                            showShieldedOutflow={showShieldedOutflow}
                            onShieldedOutflowToggle={setShowShieldedOutflow}
                            assets={assets}
                        />
                    </div>
                )}
            </div>

            {/* Charts */}
            <div className="space-y-8">
                {visibility.maspAggregates && (
                    <ErrorBoundary>
                        <MaspAggregatesChartContainer
                            isLoadingRegistry={isLoadingRegistry}
                            selectedAsset={selectedAsset}
                            selectedTimeframe={selectedTimeframe}
                            showShieldedInflow={showShieldedInflow}
                            showShieldedOutflow={showShieldedOutflow}
                            assets={assets}
                        />
                    </ErrorBoundary>
                )}

                {visibility.maspTxVolume && (
                    <ErrorBoundary>
                        <MaspTxVolumeChartContainer
                            isLoadingRegistry={isLoadingRegistry}
                            selectedAsset={selectedAsset}
                            selectedTimeframe={selectedTimeframe}
                            showShieldedInflow={showShieldedInflow}
                            showShieldedOutflow={showShieldedOutflow}
                            assets={assets}
                        />
                    </ErrorBoundary>
                )}
                {/* Add more charts here as they become available */}
            </div>

            {!visibility.maspAggregates && (
                <div className="min-h-[300px] flex items-center justify-center text-xl font-light text-white/50">
                    No charts selected
                </div>
            )}
        </div>
    );
}

export default ChartContainer;
