import AssetRow from "./AssetRow";
import { useTokenPrices } from "../../hooks/useTokenPrices";
import "../../styles/shared.css";
import { useTokenList } from "../../hooks/useTokenList";
import { Token, IbcToken } from "../../types/token";
import { RegistryAsset } from "../../types/chainRegistry";
import { ViewMode } from "./AssetTableContainer";
import { useMaspBalances } from "../../hooks/useMaspBalances";
import { useMaspAggregates } from "../../hooks/useMaspAggregates";

interface AssetColumnProps {
    sortedAssets: RegistryAsset[];
    viewMode: ViewMode;
}

function AssetColumn({ sortedAssets, viewMode }: AssetColumnProps) {
    const { data: tokenList, isLoading: isLoadingTokenList } = useTokenList();
    const { data: tokenPrices, isLoading: isLoadingPrices } = useTokenPrices();
    const { data: maspBalances, isLoading: isLoadingMaspBalances } = useMaspBalances();
    const { data: maspAggregates, isLoading: isLoadingMaspAggregates } = useMaspAggregates();

    if (!sortedAssets) {
        return (
            <div className="p-4">
            </div>
        );
    }

    return (
        <div className="border-dashed border-r border-[#939393]">
            {/* Header section */}
            <div className="column-heading-container pr-4">
                <div className="flex-1 p-4">
                    <h2 className="section-heading">Assets in Namada</h2>
                    <div className="flex items-center mt-2">
                        <span className="px-2 py-0.5 text-[13px] tracking-[0.2px] font-light rounded-md border-2 border-[#FFFF00]/50">
                            = Shielded Incentives
                        </span>
                    </div>
                </div>
                <div className="h-[40px] px-4 flex items-center">
                    {/* Token Column */}
                    <div className="flex items-center space-x-3">
                        <div className="w-[40px] column-heading-text">Token</div>
                    </div>

                    {/* Data Columns Container - matches AssetRow structure */}
                    <div className="flex gap-12 ml-12 flex-1">
                        {/* Historical Value Shielded Column */}
                        <div className="w-[200px] column-heading-text">
                            Historical Value Shielded
                        </div>

                        {/* Current Value Shielded Column */}
                        <div className="w-[320px] column-heading-text">
                            Current Value Shielded
                        </div>
                    </div>
                </div>
            </div>

            {/* Asset rows */}
            <div className="flex flex-col gap-4">
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
                        maspAggregates={maspAggregates}
                        isLoading={isLoadingMaspBalances}
                        sortedAssets={sortedAssets}
                    />
                ))}
            </div>
        </div>
    );
}

export default AssetColumn;
