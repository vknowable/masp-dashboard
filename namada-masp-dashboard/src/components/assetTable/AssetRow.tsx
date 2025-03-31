import { formatNumber, denomAmount } from "../../utils/numbers";
import { RegistryAsset } from "../../types/chainRegistry";
import { TransformedTokenSupply } from "../../api/chain";
import NetChangeSpans from "./NetChangeSpans";
import "../../styles/shared.css";

interface AssetRowProps {
    token: RegistryAsset;
    tokenPrice: number | null;
    tokenSupplies: TransformedTokenSupply | null;
    isLoading?: boolean;
    trace?: string;
}

function AssetRow({
    token,
    tokenPrice,
    tokenSupplies,
    isLoading,
    trace,
}: AssetRowProps) {
    if (isLoading) {
        return (
            <div className="p-4">
                <div className="animate-pulse space-y-4">
                    {[...Array(1)].map((_, i) => (
                        <div key={i} className="h-[96px] bg-gray-700 rounded" />
                    ))}
                </div>
            </div>
        );
    }

    // TODO: Add loading state for token supplies, so we can still show the token symbol and icon
    if (!tokenSupplies) {
        return (
            <div className="p-4">
                <div className="animate-pulse space-y-4">
                    {[...Array(1)].map((_, i) => (
                        <div key={i} className="h-[96px] bg-gray-700 rounded" />
                    ))}
                </div>
            </div>
        );
    }

    const rawCurrentSupply = tokenSupplies.supplies.current;
    const denomCurrentSupply = denomAmount(rawCurrentSupply, 6);

    return (
        <div className="h-[94px] p-4 pr-32 flex gap-12 items-center bg-[#010101] rounded-tl-[5px] rounded-bl-[5px]">
            {/* Token Column */}
            <div className="flex items-center space-x-3">
                {/* Asset Icon with Tooltip */}
                <div className="relative group">
                    <div className="w-[40px] h-[40px] rounded-full overflow-hidden bg-gray-700 flex-shrink-0">
                        {token.logo_URIs?.svg && (
                            <img
                                src={token.logo_URIs.svg}
                                alt={`${token.symbol} logo`}
                                className="w-[40px] h-[40px] object-cover"
                                height={40}
                                width={40}
                            />
                        )}
                    </div>
                    {/* Tooltip */}
                    <div className="absolute left-0 bottom-full mb-2 px-4 py-2 bg-[#222] text-white text-sm rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 whitespace-nowrap">
                        <div className="text-gray-400 ">
                            <div className="mb-1">{token.address}</div>
                            {trace && <div>{trace}</div>}
                        </div>
                    </div>
                </div>

                {/* Token Symbol */}
                {/* <div className="text-sm text-white">
                    {token.symbol}
                </div> */}
            </div>

            {/* Total Value Column */}
            <div className="flex-1">
                <div className="asset-amt-text">
                    {formatNumber(denomCurrentSupply, 2)} {token.symbol}
                </div>
                <div className="asset-amt-usd-text">
                    $
                    {tokenPrice && denomCurrentSupply
                        ? formatNumber(denomCurrentSupply * tokenPrice, 2)
                        : "--"}
                </div>
                <NetChangeSpans changes={tokenSupplies.supplies.changes} />
            </div>
        </div>
    );
}

export default AssetRow;
