import { TransformedMaspBalance, TransformedTokenSupply } from "../../api/chain"
import { RegistryAsset } from "../../types/chainRegistry"
import { denomAmount, formatNumber } from "../../utils/numbers"
import { ViewMode } from './AssetTableContainer'
import NetChangeSpans from './NetChangeSpans'

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
                    {[...Array(1)].map((_, i) => (
                        <div key={i} className="h-[96px] bg-gray-700 rounded" />
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
                        <div key={i} className="h-[96px] bg-gray-700 rounded" />
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
        // if (totalNet && maspNet) {
        //     return totalNet - maspNet
        // }
        return 0 // until fixed
    }

    // Calculate transparent changes
    const transparentChanges = {
        '24h': calcNetChangeTransparent(tokenSupplies.supplies.changes['24h'], maspBalances.balances.changes['24h']),
        '7d': calcNetChangeTransparent(tokenSupplies.supplies.changes['7d'], maspBalances.balances.changes['7d']),
        '30d': calcNetChangeTransparent(tokenSupplies.supplies.changes['30d'], maspBalances.balances.changes['30d'])
    }

    return (
        <div className="h-[94px] p-4 flex items-center bg-[#010101] rounded-tr-[5px] rounded-br-[5px]">

            {/* Total Value Column */}
            <div className="flex-1 pl-8">
                <div className="asset-amt-text">
                    {formatNumber(viewMode === 'shielded' ? denomCurrentMasp : denomCurrentTransparent, 6)} {token.symbol}
                </div>
                <div className="asset-amt-usd-text">
                    ${viewMode === 'shielded' ?
                        (tokenPrice && denomCurrentMasp) ? formatNumber(denomCurrentMasp * tokenPrice, 6) : "--" :
                        (tokenPrice && denomCurrentTransparent) ? formatNumber(denomCurrentTransparent * tokenPrice, 6) : "--"
                    }
                </div>
                <NetChangeSpans 
                    changes={viewMode === 'shielded' ? maspBalances.balances.changes : transparentChanges} 
                />
            </div>
        </div>
    )
}

export default MetricsRow 