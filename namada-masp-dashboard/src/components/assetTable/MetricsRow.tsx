type ViewMode = 'shielded' | 'transparent'

interface MetricsRowProps {
    metrics?: {
        totalValue: string
        currentValue: string
        percentageChanges: {
            '24h': number
            '7d': number
            '30d': number
        }
        rewardsParam?: string
    }
    viewMode: ViewMode
}

function MetricsRow({ metrics, viewMode }: MetricsRowProps) {
    if (!metrics) return null

    const formatPercentage = (value: number, period: string) => {
        const formatted = value.toFixed(2)
        const isPositive = value > 0
        return (
            <span className={`${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                {isPositive ? '+' : ''}{formatted}%
                <span className="text-gray-500 ml-1">({period})</span>
            </span>
        )
    }

    const formatValue = (value: string) => {
        // Add proper formatting logic here if needed
        return value
    }

    return (
        <div className="h-[88px] p-4 flex items-start">
            {/* Total Value Column */}
            <div className="flex-1">
                <div className="text-sm text-white">
                    {formatValue(metrics.totalValue)}
                </div>
                <div className="flex gap-2 mt-1 text-xs">
                    {formatPercentage(metrics.percentageChanges['24h'], '24h')}
                    <span className="text-gray-500">/</span>
                    {formatPercentage(metrics.percentageChanges['7d'], '7d')}
                    <span className="text-gray-500">/</span>
                    {formatPercentage(metrics.percentageChanges['30d'], '30d')}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                    $0,000,000.000000
                </div>
            </div>

            {/* Current Value Column */}
            <div className="flex-1">
                <div className="text-sm text-white">
                    {formatValue(metrics.currentValue)}
                </div>
                <div className="flex gap-2 mt-1 text-xs">
                    {formatPercentage(metrics.percentageChanges['24h'], '24h')}
                    <span className="text-gray-500">/</span>
                    {formatPercentage(metrics.percentageChanges['7d'], '7d')}
                    <span className="text-gray-500">/</span>
                    {formatPercentage(metrics.percentageChanges['30d'], '30d')}
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