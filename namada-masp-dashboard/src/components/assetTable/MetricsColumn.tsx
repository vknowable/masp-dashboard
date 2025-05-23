import { useMaspBalances } from "../../hooks/useMaspBalances";
import { useTransparentBalances } from "../../hooks/useTransparentBalances";
import { useRegistryData } from "../../hooks/useRegistryData";
import { useTokenPrices } from "../../hooks/useTokenPrices";
import { ViewMode } from "./AssetTableContainer";
import MetricsRow from "./MetricsRow";
// import ViewToggle from './ViewToggle'
import "../../styles/shared.css";

interface MetricsColumnProps {
    viewMode: ViewMode;
    onViewChange: (view: ViewMode) => void;
}

function MetricsColumn({
    viewMode: _viewMode,
    onViewChange: _onViewChange,
}: MetricsColumnProps) {
    const { assets, isLoading: isLoadingRegistry } = useRegistryData();
    const { data: tokenPrices, isLoading: isLoadingPrices } = useTokenPrices();
    const { data: maspBalances, isLoading: isLoadingMaspBalances } =
        useMaspBalances();
    const { data: transparentBalances, isLoading: isLoadingTransparentBalances } =
        useTransparentBalances();

    if (isLoadingRegistry || !assets) {
        return (
            <div>
            </div>
        );
    }

    return (
        <div className="h-full">
            <div className="column-heading-container justify-end rounded-tr-[5px]">
                <div className="h-[40px] px-4 flex items-center">
                    <div className="flex column-heading-text w-full pl-8">
                        <>
                            <div className="flex-1">Current Value Shielded</div>
                            <div className="flex-1">Current Value Transparent</div>
                            <div className="w-[150px] flex justify-center">
                                Est. Rewards Rate
                            </div>
                        </>
                    </div>
                </div>
            </div>
            <div className="flex flex-col gap-2">
                {assets.map((token) => (
                    <MetricsRow
                        key={token.address}
                        token={token}
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
                    />
                ))}
            </div>
        </div>
    );
}

export default MetricsColumn;
