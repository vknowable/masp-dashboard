import { useState } from 'react'
import AssetColumn from './AssetColumn'
import MetricsColumn from './MetricsColumn'
import ErrorBoundary from '../common/ErrorBoundary'
import '../../styles/shared.css';

export type ViewMode = 'shielded' | 'transparent'

function AssetTableContainer() {
    const [viewMode, setViewMode] = useState<ViewMode>('shielded')

    return (
        <div className="container-surface overflow-hidden pb-8 pt-0 mt-8">
            <div className="flex h-full">
                {/* Left column - Asset Info */}
                <ErrorBoundary>
                    <div className="flex-2">
                        <AssetColumn />
                    </div>
                </ErrorBoundary>

                {/* Right column - Metrics */}
                <ErrorBoundary>
                    <div className="flex-1">
                        <MetricsColumn
                            viewMode={viewMode}
                            onViewChange={setViewMode}
                        />
                    </div>
                </ErrorBoundary>
            </div>
        </div>
    )
}

export default AssetTableContainer