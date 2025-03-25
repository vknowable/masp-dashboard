import { Dispatch, SetStateAction } from "react";
import { RegistryAsset } from "../../../types/chainRegistry";
import { MaspAggregatesWindow } from "./MaspTxVolumeChartContainer";
import CustomCheckbox from "../../common/CustomCheckbox";

interface MaspTxVolumeChartTopBarProps {
    selectedAsset: string;
    onAssetSelect: Dispatch<SetStateAction<string>>;
    selectedTimeframe: MaspAggregatesWindow;
    onTimeframeSelect: Dispatch<SetStateAction<MaspAggregatesWindow>>;
    showShieldedInflow: boolean;
    onShieldedInflowToggle: Dispatch<SetStateAction<boolean>>;
    showShieldedOutflow: boolean;
    onShieldedOutflowToggle: Dispatch<SetStateAction<boolean>>;
    assets?: RegistryAsset[];
}

export default function MaspTxVolumeChartTopBar({
    selectedAsset,
    onAssetSelect,
    selectedTimeframe,
    onTimeframeSelect,
    showShieldedInflow,
    onShieldedInflowToggle,
    showShieldedOutflow,
    onShieldedOutflowToggle,
    assets = [],
}: MaspTxVolumeChartTopBarProps) {
    return (
        <div className="min-w-full min-h-[36px] flex flex-col sm:flex-row sm:justify-between gap-4 sm:items-end mb-4">
            <div className="flex items-center gap-4">
                {/* Asset Select */}
                <div className="flex flex-col gap-1">
                    <div className="text-[11px] font-light tracking-[0.4px] text-white/90 pl-2">
                        Select asset
                    </div>
                    <select
                        value={selectedAsset}
                        onChange={(e) => onAssetSelect(e.target.value)}
                        className="bg-[#3A3A3A] text-white font-light text-[14px] min-w-[170px] h-[26px] text-center px-4 py-[2px] rounded-[5px] border border-[#707070] focus:outline-none focus:border-white"
                    >
                        <option value="All">All</option>
                        {assets.map((asset) => (
                            <option
                                key={asset.symbol}
                                value={asset.symbol}
                                className="text-[14px] font-light"
                            >
                                {asset.symbol}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Time Select */}
                <div className="flex flex-col gap-1">
                    <div className="text-[11px] font-light tracking-[0.4px] text-white/90 pl-2">
                        Time
                    </div>
                    <div className="flex text-[12px] h-[26px] font-light rounded-[5px] overflow-hidden border border-[#707070]">
                        {(["24hr", "7d", "30d", "Alltime"] as const).map((time) => (
                            <button
                                key={time}
                                onClick={() => onTimeframeSelect(time)}
                                className={`
                  px-4 py-[2px] transition-colors
                  ${selectedTimeframe === time
                                        ? "bg-[#707070]"
                                        : "bg-[#2A2A2A] text-white hover:bg-[#3A3A3A]"
                                    }
                `}
                            >
                                {time === "Alltime" ? "ALL" : time}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Flow Toggles */}
            <div className="flex items-center gap-4">
                <CustomCheckbox
                    checked={showShieldedInflow}
                    onChange={onShieldedInflowToggle}
                    label="MASP Inflow"
                    borderColor="grey"
                    checkColor="yellow"
                />

                <CustomCheckbox
                    checked={showShieldedOutflow}
                    onChange={onShieldedOutflowToggle}
                    label="MASP Outflow"
                    borderColor="grey"
                    checkColor="white"
                />
            </div>
        </div>
    );
}
