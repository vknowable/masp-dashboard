import { denomAmount, formatNumber } from "../../utils/numbers"

type ViewMode = 'shielded' | 'transparent'

interface MetricsRowProps {
    metrics?: {
        symbol: string
        totalShielded: string
        currentShielded: string
        totalTransparent: string
        currentTransparent: string
        rewardsParam?: string
    }
    viewMode: ViewMode
}

function MetricsRow({ metrics, viewMode }: MetricsRowProps) {
    if (!metrics) return null

    const formatValue = (value: string) => {
        // Add proper formatting logic here if needed
        return value
    }

    return (
        <div className="h-[88px] p-4 flex items-start">
            {/* Total Value Column */}
            <div className="flex-1">
                <div className="text-sm text-white">
                    {`${formatNumber(denomAmount(viewMode === 'shielded' ? metrics.totalShielded : metrics.totalTransparent, 6), 6)} ${metrics.symbol}`}
                </div>
                <div className="flex gap-2 mt-1 text-xs">
                    {"-- '24h'"}
                    <span className="text-gray-500">/</span>
                    {"-- '24h'"}
                    <span className="text-gray-500">/</span>
                    {"-- '24h'"}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                    $0,000,000.000000
                </div>
            </div>

            {/* Current Value Column */}
            <div className="flex-1">
                <div className="text-sm text-white">
                    {`${formatNumber(denomAmount(viewMode === 'shielded' ? metrics.currentShielded : metrics.currentTransparent, 6), 6)} ${metrics.symbol}`}
                </div>
                <div className="flex gap-2 mt-1 text-xs">
                    {"-- '24h'"}
                    <span className="text-gray-500">/</span>
                    {"-- '24h'"}
                    <span className="text-gray-500">/</span>
                    {"-- '24h'"}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                    $0,000,000.000000
                </div>
            </div>

            {/* Rewards Param Column - Only show in shielded mode */}
            {viewMode === 'shielded' && (
                <div className="w-[150px] flex items-center h-full text-yellow-400">
                    {metrics.rewardsParam ?? 'xxxxxxxx'}
                </div>
            )}
        </div>
    )
}

export default MetricsRow 