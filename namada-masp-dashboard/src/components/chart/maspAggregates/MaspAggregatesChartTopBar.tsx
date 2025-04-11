import { useState, useRef, useEffect } from "react";
import CustomCheckbox from "../../common/CustomCheckbox";
import { RegistryAsset } from "../../../types/chainRegistry";
import { MaspAggregatesWindow } from "./MaspAggregatesChartContainer";

interface MaspAggregatesChartTopBarProps {
    selectedAssets: string[];
    onAssetsSelect: (assets: string[]) => void;
    selectedTimeframe: MaspAggregatesWindow;
    onTimeframeSelect: (timeframe: MaspAggregatesWindow) => void;
    showShieldedInflow: boolean;
    onShieldedInflowToggle: (show: boolean) => void;
    showShieldedOutflow: boolean;
    onShieldedOutflowToggle: (show: boolean) => void;
    assets: RegistryAsset[];
}

export default function MaspAggregatesChartTopBar({
    selectedAssets,
    onAssetsSelect,
    selectedTimeframe,
    onTimeframeSelect,
    showShieldedInflow,
    onShieldedInflowToggle,
    showShieldedOutflow,
    onShieldedOutflowToggle,
    assets,
}: MaspAggregatesChartTopBarProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleAssetToggle = (asset: string) => {
        const newSelection =
            asset === "All" ? ["All"] : selectedAssets.filter((a) => a !== "All");

        if (selectedAssets.includes(asset)) {
            // Remove asset if it exists
            const filtered = newSelection.filter((a) => a !== asset);
            // If removing the last asset, default to "All"
            onAssetsSelect(filtered.length === 0 ? ["All"] : filtered);
        } else {
            // Add asset if it doesn't exist
            onAssetsSelect([...newSelection, asset]);
        }
    };

    return (
        <div className="flex flex-wrap gap-4 items-center mb-4">
            {/* Asset Selection Dropdown */}
            <div className="relative w-48" ref={dropdownRef}>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full flex items-center justify-between px-4 py-2 text-sm bg-[#2A2A2A] rounded-lg focus:outline-none"
                >
                    <span className="block truncate">
                        {selectedAssets.includes("All")
                            ? "All Assets"
                            : `${selectedAssets.length} Selected`}
                    </span>
                    <svg
                        className={`w-4 h-4 ml-2 transition-transform ${isOpen ? "rotate-180" : ""
                            }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                        />
                    </svg>
                </button>

                {/* Dropdown Menu */}
                {isOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-[#2A2A2A] rounded-md shadow-lg max-h-60 overflow-auto">
                        <div className="p-2">
                            <CustomCheckbox
                                checked={selectedAssets.includes("All")}
                                onChange={() => handleAssetToggle("All")}
                                label="All Assets"
                                borderColor="grey"
                                checkColor="white"
                            />
                        </div>
                        <div className="border-t border-gray-600" />
                        {assets.map((asset) => (
                            <div key={asset.symbol} className="p-2">
                                <CustomCheckbox
                                    checked={selectedAssets.includes(asset.symbol)}
                                    onChange={() => handleAssetToggle(asset.symbol)}
                                    label={asset.symbol}
                                    borderColor="grey"
                                    checkColor="white"
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Time Select */}
            <div className="flex flex-col items-center gap-0 -mt-4">
                <span className="text-[11px] font-light tracking-[0.4px] text-white/90 mb-1">
                    Time
                </span>
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

            {/* Flow Toggles */}
            <div className="flex items-center gap-4 ml-2 mt-1">
                <CustomCheckbox
                    checked={showShieldedInflow}
                    onChange={onShieldedInflowToggle}
                    label="MASP Inflow"
                    borderColor="yellow"
                    checkColor="black"
                    fill="yellow"
                />

                <CustomCheckbox
                    checked={showShieldedOutflow}
                    onChange={onShieldedOutflowToggle}
                    label="MASP Outflow"
                    borderColor="grey"
                    checkColor="black"
                    fill="grey"
                />
            </div>
        </div>
    );
}
