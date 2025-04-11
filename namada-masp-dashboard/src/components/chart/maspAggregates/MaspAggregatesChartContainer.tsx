import MaspAggregatesChart from "./MaspAggregatesChart";
import { useMaspAggregates } from "../../../hooks/useMaspAggregates";

import { RegistryAsset } from "../../../types/chainRegistry";
import MaspAggregatesChartTopBar from "./MaspAggregatesChartTopBar";
import { useState } from "react";
export type MaspAggregatesWindow = "24hr" | "7d" | "30d" | "Alltime";
interface MaspAggregatesChartContainerProps {
    isLoading?: boolean;
    error?: Error | null;
    isLoadingRegistry?: boolean;
    assets: RegistryAsset[];
}

export default function MaspAggregatesChartContainer({
    isLoading = false,
    error = null,
    isLoadingRegistry = false,
    assets,
}: MaspAggregatesChartContainerProps) {
    const { data: maspAggregates = [], isLoading: isLoadingAggregates } =
        useMaspAggregates();

    const [selectedAssets, setSelectedAssets] = useState<string[]>(["All"]);
    const [selectedTimeframe, setSelectedTimeframe] =
        useState<MaspAggregatesWindow>("24hr");
    const [showShieldedInflow, setShowShieldedInflow] = useState(true);
    const [showShieldedOutflow, setShowShieldedOutflow] = useState(true);

    if (isLoading || isLoadingRegistry || isLoadingAggregates) {
        return (
            <div className="px-4 py-4">
                <div className="rounded-[5px] bg-[#F5F5F5] dark:bg-[#191919] min-w-full min-h-[508px] pt-2 px-2">
                    <div className="min-h-[36px] animate-pulse bg-[#2A2A2A] rounded-lg mb-4" />
                    <div className="h-[440px] animate-pulse bg-[#2A2A2A] rounded-lg" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="px-4 py-4">
                <div className="rounded-[5px] bg-[#F5F5F5] dark:bg-[#191919] min-w-full p-4">
                    <div className="text-red-400 bg-red-900/20 rounded-lg p-4">
                        Error loading chart data: {error.message}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="px-4 py-4">
            <div className="section-heading text-center text-xl md:text-2xl">
                MASP Total Inflow/Outflow (USD)
            </div>

            <div className="flex flex-col w-full">
                <MaspAggregatesChartTopBar
                    selectedAssets={selectedAssets}
                    onAssetsSelect={setSelectedAssets}
                    selectedTimeframe={selectedTimeframe}
                    onTimeframeSelect={setSelectedTimeframe}
                    showShieldedInflow={showShieldedInflow}
                    onShieldedInflowToggle={setShowShieldedInflow}
                    showShieldedOutflow={showShieldedOutflow}
                    onShieldedOutflowToggle={setShowShieldedOutflow}
                    assets={assets}
                />
            </div>

            <div className="min-w-full min-h-[508px]">
                <MaspAggregatesChart
                    selectedAssets={selectedAssets}
                    selectedTimeframe={selectedTimeframe}
                    showShieldedInflow={showShieldedInflow}
                    showShieldedOutflow={showShieldedOutflow}
                    assets={assets}
                    maspAggregates={maspAggregates}
                />
            </div>
        </div>
    );
}
