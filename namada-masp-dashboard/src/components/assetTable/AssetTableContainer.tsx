import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchChainMetadata } from '../../api/chainRegistry'
import { fetchMaspInfo, fetchTokens } from '../../api/tokens'
import AssetInfoColumn from './AssetInfoColumn'
import MetricsColumn from './MetricsColumn'
import { TokenDisplayRow } from '../../types/token'

type ViewMode = 'shielded' | 'transparent'

function AssetTableContainer() {
    const [viewMode, setViewMode] = useState<ViewMode>('shielded')

    const { data: registryData, isLoading: isLoadingRegistry } = useQuery({
        queryKey: ['registryData'],
        queryFn: () => fetchChainMetadata("namada", true)
    })

    const { data: maspInfo, isLoading: isLoadingMaspInfo } = useQuery({
        queryKey: ['maspInfo'],
        queryFn: fetchMaspInfo,
        refetchInterval: 30000,
        staleTime: 300000,
    })

    const { data: tokens = [], isLoading: isLoadingTokens } = useQuery({
        queryKey: ['tokens'],
        queryFn: () => fetchTokens(maspInfo?.rewardTokens ?? [], registryData?.assetList?.assets ?? []),
        refetchInterval: 30000,
        staleTime: 300000,
        enabled: !!maspInfo && !!registryData,
    })

    // Transform token data into metrics format
    const metrics = tokens.reduce((acc: Record<string, any>, token: TokenDisplayRow) => {
        acc[token.address] = {
            totalValue: token.totalAmount.toString(),
            currentValue: token.maspAmount.toString(),
            percentageChanges: {
                '24h': token.ssrRateLast ?? 0,
                '7d': token.estRateCur ?? 0,
                '30d': token.estRewardsCur ?? 0
            }
        }
        return acc
    }, {})

    const isLoading = isLoadingRegistry || isLoadingMaspInfo || isLoadingTokens

    return (
        <div className="px-4 mt-4">
            <div className="w-full bg-[#1E1E1E] rounded-lg overflow-hidden pb-8">
                <div className="flex h-full">
                    {/* Left column - Asset Info */}
                    <div className="flex-1">
                        <AssetInfoColumn
                            assets={registryData?.assetList?.assets}
                            isLoading={isLoading}
                        />
                    </div>

                    {/* Right column - Metrics */}
                    <div className="flex-1">
                        <MetricsColumn
                            viewMode={viewMode}
                            onViewChange={setViewMode}
                            assets={registryData?.assetList?.assets}
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