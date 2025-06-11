import { formatNetChange, getNetChangeColor } from "../../utils/numbers";
import React from "react";
import "../../styles/shared.css";

interface TimeWindow {
    value: number | null;
    label: string;
}

interface NetChangeSpansProps {
    changes: {
        "24h": number | null;
        "7d": number | null;
        "30d": number | null;
    };
}

function NetChangeSpans({ changes }: NetChangeSpansProps) {
    const timeWindows: TimeWindow[] = [
        { value: changes["24h"], label: "24h" },
        { value: changes["7d"], label: "7d" },
        { value: changes["30d"], label: "30d" },
    ];

    return (
        <div className="flex gap-4 asset-change-text">
            {timeWindows.map((window) => (
                <div key={window.label} className="flex whitespace-nowrap">
                    <div>
                        <span className={getNetChangeColor(window.value)}>
                            {formatNetChange(window.value?.toString() ?? null)}
                        </span>
                        <span className="text-[#B9B9B9] ml-1">({window.label})</span>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default NetChangeSpans;
