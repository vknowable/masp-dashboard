import { TransformedMaspBalance, TransformedTokenSupply } from "../../api/chain"
import { RegistryAsset } from "../../types/chainRegistry"
import { denomAmount, formatNetChange, formatNumber, getNetChangeColor } from "../../utils/numbers"
import { ViewMode } from './AssetTableContainer'

interface MetricsRowProps {
    viewMode: ViewMode
    token: RegistryAsset
    tokenPrice: number | null
    tokenSupplies: TransformedTokenSupply | null
    maspBalances: TransformedMaspBalance | null
    isLoading?: boolean
}

function MetricsRow({ viewMode, token, tokenPrice, tokenSupplies, maspBalances, isLoading }: MetricsRowProps) {

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
    if (!tokenSupplies || !maspBalances) {
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

    const rawCurrentMasp = maspBalances.balances.current
    const denomCurrentMasp = denomAmount(rawCurrentMasp, 6)

    const rawCurrentTransparent = rawCurrentSupply && rawCurrentMasp ? rawCurrentSupply - rawCurrentMasp : null
    const denomCurrentTransparent = denomAmount(rawCurrentTransparent, 6)

    const calcNetChangeTransparent = (totalNet: number | null, maspNet: number | null) => {
        if (totalNet && maspNet) {
            return totalNet - maspNet
        }
        return null
    }

    return (
        <div className="h-[88px] p-4 flex items-center">

            {/* Total Value Column */}
            <div className="flex-1">
                <div className="text-sm text-white">
                    {formatNumber(viewMode === 'shielded' ? denomCurrentMasp : denomCurrentTransparent, 6)} {token.symbol}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                    ${viewMode === 'shielded' ?
                        (tokenPrice && denomCurrentMasp) ? formatNumber(denomCurrentMasp * tokenPrice, 6) : "--" :
                        (tokenPrice && denomCurrentTransparent) ? formatNumber(denomCurrentTransparent * tokenPrice, 6) : "--"
                    }
                </div>
                <div className="flex gap-2 mt-1 text-xs">
                    <span className={getNetChangeColor(calcNetChangeTransparent(tokenSupplies.supplies.changes['24h'], maspBalances.balances.changes['24h']))}>
                        {viewMode === 'shielded' ?
                            formatNetChange(maspBalances.balances.changes['24h']?.toString() ?? null) :
                            formatNetChange(calcNetChangeTransparent(tokenSupplies.supplies.changes['24h'], maspBalances.balances.changes['24h'])?.toString() ?? null)
                        } (24h)
                    </span>
                    <span className="text-gray-500">/</span>
                    <span className={getNetChangeColor(calcNetChangeTransparent(tokenSupplies.supplies.changes['7d'], maspBalances.balances.changes['7d']))}>
                        {viewMode === 'shielded' ?
                            formatNetChange(maspBalances.balances.changes['7d']?.toString() ?? null) :
                            formatNetChange(calcNetChangeTransparent(tokenSupplies.supplies.changes['7d'], maspBalances.balances.changes['7d'])?.toString() ?? null)
                        } (7d)
                    </span>
                    <span className="text-gray-500">/</span>
                    <span className={getNetChangeColor(calcNetChangeTransparent(tokenSupplies.supplies.changes['30d'], maspBalances.balances.changes['30d']))}>
                        {viewMode === 'shielded' ?
                            formatNetChange(maspBalances.balances.changes['30d']?.toString() ?? null) :
                            formatNetChange(calcNetChangeTransparent(tokenSupplies.supplies.changes['30d'], maspBalances.balances.changes['30d'])?.toString() ?? null)
                        } (30d)
                    </span>
                </div>
            </div>
        </div>
    )
}

export default MetricsRow 