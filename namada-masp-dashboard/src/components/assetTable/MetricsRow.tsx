import { TransformedTokenSupply } from "../../api/chain"
import { RegistryAsset } from "../../types/chainRegistry"
import { ViewMode } from './AssetTableContainer'

interface MetricsRowProps {
    viewMode: ViewMode
    token: RegistryAsset
    tokenPrice: number | null
    tokenSupplies: TransformedTokenSupply | null
    isLoading?: boolean
}

function MetricsRow({ viewMode, token, tokenPrice, tokenSupplies, isLoading }: MetricsRowProps) {

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

    // TODO: Add loading state for token supplies, so we can still show the token symbol and icon
    if (!tokenSupplies) {
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
        <div className="h-[88px] p-4 flex items-start">

            {/* Current Value Column */}
            <div className="flex-1">
                <div className="text-sm text-white">
                    {/* {`${formatNumber(denomAmount(viewMode === 'shielded' ? metrics.currentShielded : metrics.currentTransparent, 6), 6)} ${metrics.symbol}`} */}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                    {/* ${viewMode === 'shielded' ?
                        (tokenPrice && currentDenomShielded) ? formatNumber(currentDenomShielded * tokenPrice, 6) : "--" :
                        (tokenPrice && currentDenomTransparent) ? formatNumber(currentDenomTransparent * tokenPrice, 6) : "--"
                    } */}
                </div>
                <div className="flex gap-2 mt-1 text-xs">
                    {"-- '24h'"}
                    <span className="text-gray-500">/</span>
                    {"-- '24h'"}
                    <span className="text-gray-500">/</span>
                    {"-- '24h'"}
                </div>
            </div>

            {/* Rewards Param Column - Only show in shielded mode */}
            {viewMode === 'shielded' && (
                <div className="w-[150px] flex items-center h-full text-yellow-400">
                    {/* {metrics.rewardsParam ?? 'xxxxxxxx'} */}
                </div>
            )}
            
        </div>
    )
}

export default MetricsRow 