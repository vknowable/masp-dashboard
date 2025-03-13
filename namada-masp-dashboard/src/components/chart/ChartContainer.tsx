import { useState } from 'react'
import MaspAggregatesChartContainer from "./maspAggregates/MaspAggregatesChartContainer"
import CustomCheckbox from '../common/CustomCheckbox'
import ErrorBoundary from '../common/ErrorBoundary'

interface ChartVisibility {
    maspAggregates: boolean
    anotherChart: boolean
    anotherChart2: boolean
    // Add more charts here as they become available
    // tokenPrices: boolean
    // stakingMetrics: boolean
}

function ChartContainer() {
    const [visibility, setVisibility] = useState<ChartVisibility>({
        maspAggregates: true,
        anotherChart: false,
        anotherChart2: false,
        // tokenPrices: true,
        // stakingMetrics: true
    })

    const toggleChart = (chart: keyof ChartVisibility) => {
        setVisibility(prev => ({
            ...prev,
            [chart]: !prev[chart]
        }))
    }

    return (
        <div className="container-surface mt-8 py-4 px-4">
            <div className="section-heading">Namada Metrics</div>
            {/* Chart Toggles */}
            <div className="flex items-center gap-4 mb-6">
                <CustomCheckbox
                    checked={visibility.maspAggregates}
                    onChange={() => toggleChart('maspAggregates')}
                    label="MASP Inflow/Outflow"
                    borderColor="grey"
                    checkColor="white"
                />

                {/* Add more chart toggles here as they become available */}
                <CustomCheckbox
                    checked={visibility.anotherChart}
                    onChange={() => toggleChart('anotherChart')}
                    label="Another Chart"
                    borderColor="grey"
                    checkColor="white"
                />
                <CustomCheckbox
                    checked={visibility.anotherChart2}
                    onChange={() => toggleChart('anotherChart2')}
                    label="Another Chart 2"
                    borderColor="grey"
                    checkColor="white"
                />
            </div>

            {/* Charts */}
            <div className="space-y-8">
                {visibility.maspAggregates && (
                    <ErrorBoundary>
                        <MaspAggregatesChartContainer />
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
    )
}

export default ChartContainer