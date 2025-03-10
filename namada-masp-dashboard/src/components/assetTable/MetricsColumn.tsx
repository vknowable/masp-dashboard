import { TokenDisplayRow } from '../../types/token'
import MetricsRow from './MetricsRow'
import ViewToggle from './ViewToggle'

type ViewMode = 'shielded' | 'transparent'

interface MetricsColumnProps {
    viewMode: ViewMode
    onViewChange: (view: ViewMode) => void
    tokens: TokenDisplayRow[]
    metrics?: Record<string, {
        symbol: string
        totalShielded: string
        currentShielded: string
        totalTransparent: string
        currentTransparent: string
        rewardsParam?: string
    }>
    isLoading?: boolean
}

function MetricsColumn({ viewMode, onViewChange, tokens = [], metrics = {}, isLoading = false }: MetricsColumnProps) {
    if (isLoading) {
        return (
            <div className="p-4">
                <div className="animate-pulse space-y-4">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-16 bg-gray-700 rounded" />
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="h-full">
            <div className="h-[120px] bg-[#1E1E1E] flex flex-col">
                <div className="flex-1">
                    <ViewToggle currentView={viewMode} onViewChange={onViewChange} />
                </div>
                <div className="h-[40px] px-4 flex items-center">
                    <div className="flex text-xs text-gray-400 w-full">
                        {viewMode === 'shielded' ? (
                            <>
                                <div className="flex-1">Total Value Shielded</div>
                                <div className="flex-1">Current Value Shielded</div>
                                <div className="w-[150px]">Rewards Param</div>
                            </>
                        ) : (
                            <>
                                <div className="flex-1">Total Value Transparent</div>
                                <div className="flex-1">Current Value Transparent</div>
                            </>
                        )}
                    </div>
                </div>
            </div>
            <div className="divide-y divide-gray-800">
                {tokens.map((token) => (
                    <MetricsRow
                        key={token.address}
                        metrics={metrics[token.address]}
                        viewMode={viewMode}
                    />
                ))}
            </div>
        </div>
    )
}

export default MetricsColumn 