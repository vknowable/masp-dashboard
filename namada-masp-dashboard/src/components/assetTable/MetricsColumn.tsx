import { useMaspBalances } from "../../hooks/useMaspBalances";
import { useTransparentBalances } from "../../hooks/useTransparentBalances";
import { useTokenPrices } from "../../hooks/useTokenPrices";
import { ViewMode } from "./AssetTableContainer";
import MetricsRow from "./MetricsRow";
// import ViewToggle from './ViewToggle'
import "../../styles/shared.css";
import { RegistryAsset } from "../../types/chainRegistry";

interface MetricsColumnProps {
    viewMode: ViewMode;
    onViewChange: (view: ViewMode) => void;
    sortedAssets: RegistryAsset[];
}

function MetricsColumn({
    viewMode,
    onViewChange: _onViewChange,
    sortedAssets,
}: MetricsColumnProps) {
    const { data: tokenPrices, isLoading: isLoadingPrices } = useTokenPrices();
    const { data: maspBalances, isLoading: isLoadingMaspBalances } = useMaspBalances();
    const { data: transparentBalances, isLoading: isLoadingTransparentBalances } = useTransparentBalances();

    if (!sortedAssets) {
        return (
            <div>
            </div>
        );
    }

    const renderColumnHeadings = () => {
        if (viewMode === 'shielded') {
            return (
                <>
                    <div className="flex-1">Target Shielded Amt.</div>
                    <div className="flex-1">Last 24h Rewards</div>
                    <div className="w-[150px] flex justify-center">
                        Est. Next Rewards
                    </div>
                </>
            );
        } else {
            return (
                <>
                    <div className="flex-1">Current Value Transparent</div>
                    <div className="flex-1">Total Value Held in Namada</div>
                </>
            );
        }
    };

    return (
        <div className="h-full">
            <div className="column-heading-container bg-[#010101] h-[80px] justify-end rounded-tr-[5px]">
                <div className="h-[40px] px-4 flex items-center">
                    <div className="flex column-heading-text w-full pl-8">
                        {renderColumnHeadings()}
                    </div>
                </div>
            </div>
            <div className="flex flex-col gap-4">
                {sortedAssets.map((token) => (
                    <MetricsRow
                        key={token.address}
                        token={token}
                        viewMode={viewMode}
                        tokenPrice={
                            tokenPrices?.price.find(
                                (entry) => entry.id === token.coingecko_id
                            )?.usd ?? null
                        }
                        maspBalances={
                            maspBalances?.balances.find(
                                (entry) => entry.tokenAddress === token.address
                            ) ?? null
                        }
                        transparentBalances={
                            transparentBalances?.balances.find(
                                (entry) => entry.tokenAddress === token.address
                            ) ?? null
                        }
                        isLoading={
                            isLoadingMaspBalances ||
                            isLoadingTransparentBalances ||
                            isLoadingPrices
                        }
                        sortedAssets={sortedAssets}
                    />
                ))}
            </div>
        </div>
    );
}

export default MetricsColumn;
