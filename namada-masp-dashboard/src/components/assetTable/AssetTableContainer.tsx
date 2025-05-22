import { useState, useMemo } from "react";
import AssetColumn from "./AssetColumn";
import MetricsColumn from "./MetricsColumn";
import ErrorBoundary from "../common/ErrorBoundary";
import { useRegistryData } from "../../hooks/useRegistryData";
import { useTokenPrices } from "../../hooks/useTokenPrices";
import { useMaspBalances } from "../../hooks/useMaspBalances";
import { RegistryAsset } from "../../types/chainRegistry";
import { NATIVE_NAM_ADDRESS } from "../../utils/nativeAddress";
import "../../styles/shared.css";

export type ViewMode = "shielded" | "transparent";

function AssetTableContainer() {
    const [viewMode, setViewMode] = useState<ViewMode>("shielded");
    const { assets, isLoading: isLoadingRegistry } = useRegistryData();
    const { data: tokenPrices } = useTokenPrices();
    const { data: maspBalances } = useMaspBalances();

    const sortedAssets = useMemo(() => {
        if (!assets || !tokenPrices || !maspBalances) return [];

        // First, separate NAM from other assets
        const namAsset = assets.find(asset => asset.address === NATIVE_NAM_ADDRESS);
        const otherAssets = assets.filter(asset => asset.address !== NATIVE_NAM_ADDRESS);

        // Sort other assets by shielded value
        const sortedOtherAssets = [...otherAssets].sort((a, b) => {
            const aPrice = tokenPrices.price.find(p => p.id === a.coingecko_id)?.usd ?? 0;
            const bPrice = tokenPrices.price.find(p => p.id === b.coingecko_id)?.usd ?? 0;

            const aBalance = maspBalances.balances.find(bal => bal.tokenAddress === a.address)?.balances.current ?? 0;
            const bBalance = maspBalances.balances.find(bal => bal.tokenAddress === b.address)?.balances.current ?? 0;

            const aValue = aPrice * aBalance;
            const bValue = bPrice * bBalance;

            return bValue - aValue; // Descending order
        });

        // Return NAM first, followed by sorted other assets
        return namAsset ? [namAsset, ...sortedOtherAssets] : sortedOtherAssets;
    }, [assets, tokenPrices, maspBalances]);

    if (isLoadingRegistry || !assets) {
        return null;
    }

    return (
        <div className="container-surface pb-8 pt-4 px-4 mt-8 h-full w-full">
            <div className="overflow-x-auto h-full w-full pb-2">
                <div className="min-w-[1400px] h-full w-full">
                    <div className="flex h-full">
                        {/* Left column - Asset Info */}
                        <ErrorBoundary>
                            <div className="flex-2 h-full">
                                <AssetColumn sortedAssets={sortedAssets} />
                            </div>
                        </ErrorBoundary>

                        {/* Right column - Metrics */}
                        <ErrorBoundary>
                            <div className="flex-1 h-full">
                                <MetricsColumn
                                    viewMode={viewMode}
                                    onViewChange={setViewMode}
                                    sortedAssets={sortedAssets}
                                />
                            </div>
                        </ErrorBoundary>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AssetTableContainer;
