import { TransformedTokenAmount, TransformedTokenSupply } from "../../api/chain"
import { RegistryAsset } from "../../types/chainRegistry"
import { denomAmount, formatNumber } from "../../utils/numbers"
import { ViewMode } from './AssetTableContainer'
import NetChangeSpans from './NetChangeSpans'

interface MetricsRowProps {
    // viewMode: ViewMode // was used for toggling between 'tabs'
    token: RegistryAsset
    tokenPrice: number | null
    maspBalances: TransformedTokenAmount | null
    transparentBalances: TransformedTokenAmount | null
    isLoading?: boolean
}

function MetricsRow({ token, tokenPrice, maspBalances, transparentBalances, isLoading }: MetricsRowProps) {

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
    if (!maspBalances || !transparentBalances) {
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

    const rawCurrentMasp = maspBalances.balances.current
    const denomCurrentMasp = denomAmount(rawCurrentMasp, 6)

    const rawCurrentTransparent = transparentBalances.balances.current
    const denomCurrentTransparent = denomAmount(rawCurrentTransparent, 6)

    return (
        <div className="h-[94px] p-4 flex items-center bg-[#010101] rounded-tr-[5px] rounded-br-[5px]">

            {/* Shielded Value Column */}
            <div className="flex-1 pl-8">
                <div className="asset-amt-text">
                    {formatNumber(denomCurrentMasp, 6)} {token.symbol}
                </div>
                <div className="asset-amt-usd-text">
                    ${
                        (tokenPrice && denomCurrentMasp) ? formatNumber(denomCurrentMasp * tokenPrice, 2) : "--"
                    }
                </div>
                <NetChangeSpans 
                    changes={maspBalances.balances.changes} 
                />
            </div>

            {/* Transparent Value Column */}
            <div className="flex-1">
                <div className="asset-amt-text">
                    {formatNumber(denomCurrentTransparent, 6)} {token.symbol}
                </div>
                <div className="asset-amt-usd-text">
                    ${
                        (tokenPrice && denomCurrentTransparent) ? formatNumber(denomCurrentTransparent * tokenPrice, 2) : "--"
                    }
                </div>
                <NetChangeSpans 
                    changes={transparentBalances.balances.changes} 
                />
            </div>

            {/* Rewards Param Column */}
            <div className="w-[150px] text-[#FFFF00] flex items-center justify-center">
                xxxxxxxx
            </div>
        </div>
    )
}

export default MetricsRow 