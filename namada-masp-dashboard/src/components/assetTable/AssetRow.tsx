import { TokenDisplayRow } from '../../types/token'
import { formatNumber, denomAmount, getNetChangeColor, formatNetChange } from '../../utils/numbers'

interface AssetRowProps {
    token: TokenDisplayRow
}

function AssetRow({ token }: AssetRowProps) {

    return (
        <div className="h-[88px] p-4 flex items-center">
            {/* Token Column */}
            <div className="w-[200px] flex items-center space-x-3">
                {/* Asset Icon */}
                <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-700 flex-shrink-0">
                    {token.logoUrl && (
                        <img 
                            src={token.logoUrl} 
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
                    {formatNumber(denomAmount(token.totalSupply.currentSupply, 6), 6)} {token.symbol}
                </div>
                <div className="flex gap-2 mt-1 text-xs">
                    <span className={token.totalSupply['1d'] !== null ? getNetChangeColor(token.totalSupply['1d']) : "text-gray-500"}>
                        {formatNetChange(token.totalSupply['1d'])} (24h)
                    </span>
                    <span className="text-gray-500">/</span>
                    <span className={token.totalSupply['7d'] !== null ? getNetChangeColor(token.totalSupply['7d']) : "text-gray-500"}>
                        {formatNetChange(token.totalSupply['7d'])} (7d)
                    </span>
                    <span className="text-gray-500">/</span>
                    <span className={token.totalSupply['30d'] !== null ? getNetChangeColor(token.totalSupply['30d']) : "text-gray-500"}>
                        {formatNetChange(token.totalSupply['30d'])} (30d)
                    </span>
                </div>
            </div>
        </div>
    )
}

export default AssetRow 