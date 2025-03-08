import { RegistryAsset } from '../../types/chainRegistry'
import AssetRow from './AssetRow'

interface AssetInfoColumnProps {
    assets?: RegistryAsset[]
    isLoading?: boolean
}

function AssetInfoColumn({ assets = [], isLoading = false }: AssetInfoColumnProps) {
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
        <div className="divide-y divide-gray-800">
            {/* Header section */}
            <div className="h-[120px] bg-[#2A2A2A] flex flex-col">
                <div className="flex-1 p-4">
                    <h2 className="text-xl text-white">Assets in Namada</h2>
                    <div className="flex items-center mt-2">
                        <span className="px-2 py-0.5 text-xs rounded-md border border-yellow-400/50">
                            = Shielded Incentives
                        </span>
                    </div>
                </div>
                <div className="h-[40px] px-4 flex items-center border-t border-gray-800">
                    <div className="flex text-xs text-gray-400">
                        <div className="w-[200px]">Token</div>
                        <div className="flex-1">Total Value held in Namada</div>
                    </div>
                </div>
            </div>

            {/* Asset rows */}
            <div className="divide-y divide-gray-800">
                {assets.map((asset) => (
                    <AssetRow 
                        key={asset.address} 
                        asset={asset}
                    />
                ))}
            </div>
        </div>
    )
}

export default AssetInfoColumn 