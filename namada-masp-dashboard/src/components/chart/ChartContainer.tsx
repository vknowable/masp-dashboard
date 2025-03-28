import { useState } from "react";
import MaspAggregatesChartContainer from "./maspAggregates/MaspAggregatesChartContainer";
import CustomCheckbox from "../common/CustomCheckbox";
import ErrorBoundary from "../common/ErrorBoundary";
import { useRegistryData } from "../../hooks/useRegistryData";
import MaspTxVolumeChartContainer from "./maspTxVolume/MaspTxVolumeChartContainer";

interface ChartVisibility {
    maspAggregates: boolean;
    maspTxVolume: boolean;
    anotherChart2: boolean;
}

function ChartContainer() {
    const [visibility, setVisibility] = useState<ChartVisibility>({
        maspAggregates: true,
        maspTxVolume: true,
        anotherChart2: false,
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
            <div className="section-heading text-xl md:text-2xl">Namada Metrics</div>
            {/* Chart Toggles */}
            <div className="flex flex-col gap-6 mb-16">
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
                    {/* <CustomCheckbox
                        checked={visibility.anotherChart2}
                        onChange={() => toggleChart("anotherChart2")}
                        label="Another Chart 2"
                        borderColor="grey"
                        checkColor="white"
                    /> */}
                </div>
            </div>

            {/* Charts */}
            <div className="space-y-8">
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
