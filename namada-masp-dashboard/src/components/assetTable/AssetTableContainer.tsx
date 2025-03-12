import { useState } from 'react'
import AssetColumn from './AssetColumn'
import MetricsColumn from './MetricsColumn'

export type ViewMode = 'shielded' | 'transparent'

function AssetTableContainer() {
    const [viewMode, setViewMode] = useState<ViewMode>('shielded')

    return (
        <div className="px-4 mt-4">
            <div className="w-full bg-[#1E1E1E] rounded-lg overflow-hidden pb-8">
                <div className="flex h-full">
                    {/* Left column - Asset Info */}
                    <div className="flex-1">
                        <AssetColumn />
                    </div>

                    {/* Right column - Metrics */}
                    <div className="flex-1">
                        <MetricsColumn
                            viewMode={viewMode}
                            onViewChange={setViewMode}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AssetTableContainer