import { RegistryAsset } from '../../types/chainRegistry'

interface AssetRowProps {
    asset: RegistryAsset
}

function AssetRow({ asset }: AssetRowProps) {
    return (
        <div className="h-[88px] p-4 flex items-center">
            {/* Token Column */}
            <div className="w-[200px] flex items-center space-x-3">
                {/* Asset Icon */}
                <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-700 flex-shrink-0">
                    {asset.logo_URIs?.svg && (
                        <img 
                            src={asset.logo_URIs.svg} 
                            alt={`${asset.symbol} logo`}
                            className="w-full h-full object-cover"
                        />
                    )}
                </div>

                {/* Token Symbol */}
                <div className="text-sm text-white">
                    {asset.symbol}
                </div>
            </div>

            {/* Total Value Column */}
            <div className="flex-1">
                <div className="text-sm text-white">
                    0.000,000.000000 {asset.symbol}
                </div>
                <div className="flex gap-2 mt-1 text-xs">
                    <span className="text-green-400">+15% (24h)</span>
                    <span className="text-gray-500">/</span>
                    <span className="text-red-400">-5% (7d)</span>
                    <span className="text-gray-500">/</span>
                    <span className="text-green-400">+10% (30d)</span>
                </div>
            </div>
        </div>
    )
}

export default AssetRow 