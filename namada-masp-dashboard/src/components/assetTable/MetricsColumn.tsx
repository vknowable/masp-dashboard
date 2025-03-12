import { useMaspBalances } from '../../hooks/useMaspBalances'
import { useRegistryData } from '../../hooks/useRegistryData'
import { useTokenPrices } from '../../hooks/useTokenPrices'
import { useTokenSupplies } from '../../hooks/useTokenSupplies'
import { ViewMode } from './AssetTableContainer'
import MetricsRow from './MetricsRow'
import ViewToggle from './ViewToggle'

interface MetricsColumnProps {
    viewMode: ViewMode
    onViewChange: (view: ViewMode) => void
}

function MetricsColumn({ viewMode, onViewChange }: MetricsColumnProps) {
    const { assets, isLoading: isLoadingRegistry } = useRegistryData()
    const { data: tokenPrices, isLoading: isLoadingPrices } = useTokenPrices()
    const { data: tokenSupplies, isLoading: isLoadingSupplies } = useTokenSupplies()
    const { data: maspBalances, isLoading: isLoadingMaspBalances } = useMaspBalances()
    
    if (isLoadingRegistry || !assets) {
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
                                {/* <div className="flex-1">Total Value Shielded</div> */}
                                <div className="flex-1">Current Value Shielded</div>
                                <div className="w-[150px]">Rewards Param</div>
                            </>
                        ) : (
                            <>
                                {/* <div className="flex-1">Total Value Transparent</div> */}
                                <div className="flex-1">Current Value Transparent</div>
                            </>
                        )}
                    </div>
                </div>
            </div>
            <div className="divide-y divide-gray-800">
                {assets.map((token) => (
                    <MetricsRow
                        key={token.address}
                        viewMode={viewMode}
                        token={token}
                        tokenPrice={tokenPrices?.price.find(entry => entry.id === token.coingecko_id)?.usd ?? null}
                        tokenSupplies={tokenSupplies?.supplies.find(entry => entry.address === token.address) ?? null}
                        maspBalances={maspBalances?.balances.find(entry => entry.tokenAddress === token.address) ?? null}
                        isLoading={isLoadingSupplies}
                    />
                ))}
            </div>
        </div>
    )
}

export default MetricsColumn 