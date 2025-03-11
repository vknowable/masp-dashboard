import { formatNumber, denomAmount, getNetChangeColor, formatNetChange } from '../../utils/numbers'
import { RegistryAsset } from '../../types/chainRegistry'
import { TransformedTokenSupply } from '../../api/chain'

interface AssetRowProps {
    token: RegistryAsset
    tokenPrice: number | null
    tokenSupplies: TransformedTokenSupply | null
    isLoading?: boolean
}

function AssetRow({ token, tokenPrice, tokenSupplies, isLoading }: AssetRowProps) {

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

    const rawCurrentSupply = tokenSupplies.supplies.current
    const denomCurrentSupply = denomAmount(rawCurrentSupply, 6)

    return (
        <div className="h-[88px] p-4 flex items-center">
            {/* Token Column */}
            <div className="w-[200px] flex items-center space-x-3">
                {/* Asset Icon */}
                <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-700 flex-shrink-0">
                    {token.logo_URIs?.svg && (
                        <img
                            src={token.logo_URIs.svg}
                            alt={`${token.symbol} logo`}
                            className="w-full h-full object-cover"
                        />
                    )}
                </div>

                {/* Token Symbol */}
                <div className="text-sm text-white">
                    {token.symbol}
                </div>
            </div>

            {/* Total Value Column */}
            <div className="flex-1">
                <div className="text-sm text-white">
                    {formatNumber(denomCurrentSupply, 6)} {token.symbol}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                    ${(tokenPrice && denomCurrentSupply) ? formatNumber(denomCurrentSupply * tokenPrice, 6) : "--"}
                </div>
                <div className="flex gap-2 mt-1 text-xs">
                    <span className={getNetChangeColor(tokenSupplies.supplies.changes['24h'])}>
                        {formatNetChange(tokenSupplies.supplies.changes['24h']?.toString() ?? null)} (24h)
                    </span>
                    <span className="text-gray-500">/</span>
                    <span className={getNetChangeColor(tokenSupplies.supplies.changes['7d'])}>
                        {formatNetChange(tokenSupplies.supplies.changes['7d']?.toString() ?? null)} (7d)
                    </span>
                    <span className="text-gray-500">/</span>
                    <span className={getNetChangeColor(tokenSupplies.supplies.changes['30d'])}>
                        {formatNetChange(tokenSupplies.supplies.changes['30d']?.toString() ?? null)} (30d)
                    </span>
                </div>
            </div>
        </div>
    )
}

export default AssetRow 