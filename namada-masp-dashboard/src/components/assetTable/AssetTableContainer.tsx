import { useState } from 'react'
import AssetInfoColumn from './AssetInfoColumn'
import MetricsColumn from './MetricsColumn'
import { TokenDisplayRow } from '../../types/token'

type ViewMode = 'shielded' | 'transparent'

interface AssetTableContainerProps {
    tokens: TokenDisplayRow[]
    isLoading: boolean
}

function AssetTableContainer({ tokens, isLoading }: AssetTableContainerProps) {
    const [viewMode, setViewMode] = useState<ViewMode>('shielded')

    // Transform token data into metrics format
    const metrics = tokens.reduce((acc: Record<string, any>, token: TokenDisplayRow) => {
        acc[token.address] = {
            symbol: token.symbol,
            totalShielded: token.totalShielded,
            currentShielded: token.currentShielded,
            totalTransparent: token.totalTransparent,
            currentTransparent: token.currentTransparent,
        }
        return acc
    }, {})

    return (
        <div className="px-4 mt-4">
            <div className="w-full bg-[#1E1E1E] rounded-lg overflow-hidden pb-8">
                <div className="flex h-full">
                    {/* Left column - Asset Info */}
                    <div className="flex-1">
                        <AssetInfoColumn
                            tokens={tokens}
                            isLoading={isLoading}
                        />
                    </div>

                    {/* Right column - Metrics */}
                    <div className="flex-1">
                        <MetricsColumn
                            viewMode={viewMode}
                            onViewChange={setViewMode}
                            tokens={tokens}
                            metrics={metrics}
                            isLoading={isLoading}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AssetTableContainer