import IbcAggregatesChart from "./IbcTxVolumeChart";
import { useIbcAggregates } from "../../../hooks/useIbcAggregates";
import { RegistryAsset } from "../../../types/chainRegistry";
import IbcAggregatesChartTopBar from "./IbcTxVolumeChartTopBar";
import { useState } from "react";

export type IbcAggregatesWindow = "24hr" | "7d" | "30d" | "Alltime";

interface IbcAggregatesChartContainerProps {
    isLoading?: boolean;
    error?: Error | null;
    isLoadingRegistry?: boolean;
    assets: RegistryAsset[];
}

export default function IbcAggregatesChartContainer({
    isLoading = false,
    error = null,
    isLoadingRegistry = false,
    assets,
}: IbcAggregatesChartContainerProps) {
    const { data: ibcAggregates = [], isLoading: isLoadingAggregates } =
        useIbcAggregates();

    const [selectedAssets, setSelectedAssets] = useState<string[]>(["All"]);
    const [selectedTimeframe, setSelectedTimeframe] =
        useState<IbcAggregatesWindow>("24hr");
    const [showShieldedInflow, setShowShieldedInflow] = useState(true);
    const [showShieldedOutflow, setShowShieldedOutflow] = useState(true);
    const [showTransparentInflow, setShowTransparentInflow] = useState(true);
    const [showTransparentOutflow, setShowTransparentOutflow] = useState(true);

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
                IBC Inflow/Outflow (USD)
            </div>

            <div className="flex flex-col w-full">
                <IbcAggregatesChartTopBar
                    selectedAssets={selectedAssets}
                    onAssetsSelect={setSelectedAssets}
                    selectedTimeframe={selectedTimeframe}
                    onTimeframeSelect={setSelectedTimeframe}
                    showShieldedInflow={showShieldedInflow}
                    onShieldedInflowToggle={setShowShieldedInflow}
                    showShieldedOutflow={showShieldedOutflow}
                    onShieldedOutflowToggle={setShowShieldedOutflow}
                    showTransparentInflow={showTransparentInflow}
                    onTransparentInflowToggle={setShowTransparentInflow}
                    showTransparentOutflow={showTransparentOutflow}
                    onTransparentOutflowToggle={setShowTransparentOutflow}
                    assets={assets}
                />
            </div>

            <div className="min-w-full min-h-[508px]">
                <IbcAggregatesChart
                    selectedAssets={selectedAssets}
                    selectedTimeframe={selectedTimeframe}
                    showShieldedInflow={showShieldedInflow}
                    showShieldedOutflow={showShieldedOutflow}
                    showTransparentInflow={showTransparentInflow}
                    showTransparentOutflow={showTransparentOutflow}
                    assets={assets}
                    ibcAggregates={ibcAggregates}
                />
            </div>
        </div>
    );
}
