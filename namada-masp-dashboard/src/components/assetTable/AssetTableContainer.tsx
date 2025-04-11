import { useState } from "react";
import AssetColumn from "./AssetColumn";
import MetricsColumn from "./MetricsColumn";
import ErrorBoundary from "../common/ErrorBoundary";
import "../../styles/shared.css";

export type ViewMode = "shielded" | "transparent";

function AssetTableContainer() {
    const [viewMode, setViewMode] = useState<ViewMode>("shielded");

    return (
        <div className="container-surface pb-8 pt-4 px-4 mt-8 h-full w-full">
            <div className="overflow-x-auto h-full w-full pb-2">
                <div className="min-w-[1400px] h-full w-full">
                    <div className="flex h-full">
                        {/* Left column - Asset Info */}
                        <ErrorBoundary>
                            <div className="flex-2 h-full">
                                <AssetColumn />
                            </div>
                        </ErrorBoundary>

                        {/* Right column - Metrics */}
                        <ErrorBoundary>
                            <div className="flex-1 h-full">
                                <MetricsColumn viewMode={viewMode} onViewChange={setViewMode} />
                            </div>
                        </ErrorBoundary>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AssetTableContainer;
