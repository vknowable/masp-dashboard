import { useState } from 'react'
import MaspAggregatesChart from './MaspAggregatesChart'
import MaspAggregatesChartTopBar from './MaspAggregatesChartTopBar'
import { useRegistryData } from '../../../hooks/useRegistryData'
import { useMaspAggregates } from '../../../hooks/useMaspAggregates'

export type MaspAggregatesWindow = '24hr' | '7d' | '30d' | 'Alltime'

interface MaspAggregatesChartContainerProps {
    isLoading?: boolean;
    error?: Error | null;
}

export default function MaspAggregatesChartContainer({ isLoading = false, error = null }: MaspAggregatesChartContainerProps) {
    const [selectedAsset, setSelectedAsset] = useState<string>('All')
    const [selectedTimeframe, setSelectedTimeframe] = useState<MaspAggregatesWindow>('24hr')
    const [showShieldedInflow, setShowShieldedInflow] = useState(true)
    const [showShieldedOutflow, setShowShieldedOutflow] = useState(true)

    const { assets = [], isLoading: isLoadingRegistry } = useRegistryData()
    const { data: maspAggregates = [], isLoading: isLoadingAggregates } = useMaspAggregates()

    if (isLoading || isLoadingRegistry || isLoadingAggregates) {
        return (
            <div className="px-4 py-4">
                <div className="rounded-[5px] bg-[#F5F5F5] dark:bg-[#191919] min-w-full min-h-[508px] pt-2 px-2">
                    <div className="min-h-[36px] animate-pulse bg-[#2A2A2A] rounded-lg mb-4" />
                    <div className="h-[440px] animate-pulse bg-[#2A2A2A] rounded-lg" />
                </div>
            </div>
        )
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
        )
    }

    return (
        <div className="px-4 py-4">
            <div className="rounded-[5px] bg-[#F5F5F5] dark:bg-[#191919] min-w-full min-h-[508px] pt-2 px-2">
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
                <MaspAggregatesChart 
                    selectedAsset={selectedAsset}
                    selectedTimeframe={selectedTimeframe}
                    showShieldedInflow={showShieldedInflow}
                    showShieldedOutflow={showShieldedOutflow}
                    assets={assets}
                    maspAggregates={maspAggregates}
                />
            </div>
        </div>
    )
}