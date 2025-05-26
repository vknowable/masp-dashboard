import AssetRow from "./AssetRow";
import { useTokenPrices } from "../../hooks/useTokenPrices";
import "../../styles/shared.css";
import { useTokenList } from "../../hooks/useTokenList";
import { Token, IbcToken } from "../../types/token";
import { RegistryAsset } from "../../types/chainRegistry";
import { ViewMode } from "./AssetTableContainer";
import { useMaspBalances } from "../../hooks/useMaspBalances";

interface AssetColumnProps {
    sortedAssets: RegistryAsset[];
    viewMode: ViewMode;
}

function AssetColumn({ sortedAssets, viewMode }: AssetColumnProps) {
    const { data: tokenList, isLoading: isLoadingTokenList } = useTokenList();
    const { data: tokenPrices, isLoading: isLoadingPrices } = useTokenPrices();
    const { data: maspBalances, isLoading: isLoadingMaspBalances } = useMaspBalances();

    if (!sortedAssets) {
        return (
            <div className="p-4">
            </div>
        );
    }

    return (
        <div className="border-dashed border-r border-[#939393]">
            {/* Header section */}
            <div className="column-heading-container pr-32">
                <div className="flex-1 p-4">
                    <h2 className="section-heading">Assets in Namada</h2>
                    <div className="flex items-center mt-2">
                        <span className="px-2 py-0.5 text-[13px] tracking-[0.2px] font-light rounded-md border-2 border-[#FFFF00]/50">
                            = Shielded Incentives
                        </span>
                    </div>
                </div>
                <div className="h-[40px] gap-12 px-4 flex items-center">
                    <div className="flex gap-10 column-heading-text">
                        <div className="">Token</div>
                        <div className="flex-1">
                            Current Value Shielded
                        </div>
                    </div>
                </div>
            </div>

            {/* Asset rows */}
            <div className="flex flex-col gap-2">
                {sortedAssets.map((token) => (
                    <AssetRow
                        key={token.address}
                        token={token}
                        tokenPrice={
                            tokenPrices?.price.find(
                                (entry) => entry.id === token.coingecko_id,
                            )?.usd ?? null
                        }
                        trace={(tokenList?.find(
                            (entry: Token) => entry.address === token.address,
                        ) as IbcToken)?.trace}
                        maspBalances={
                            maspBalances?.balances.find(
                                (entry) => entry.tokenAddress === token.address,
                            ) ?? null
                        }
                        isLoading={isLoadingMaspBalances}
                    />
                ))}
            </div>
        </div>
    );
}

export default AssetColumn;
