import { useState } from 'react';
import MaspTxVolumeChart from './MaspTxVolumeChart';
import { RegistryAsset } from '../../../types/chainRegistry';
import { AggregatesResponse } from '../../../types/token';
import DateTimeRangePicker from '@wojtekmaj/react-datetimerange-picker';
import '@wojtekmaj/react-datetimerange-picker/dist/DateTimeRangePicker.css';
import 'react-calendar/dist/Calendar.css';
import { customDateTimePickerStyles } from './DateTimePickerStyles';

export type MaspAggregatesWindow = "24hr" | "7d" | "30d" | "all";

interface MaspTxVolumeChartContainerProps {
    selectedAsset?: string;
    selectedTimeframe?: MaspAggregatesWindow;
    showShieldedInflow?: boolean;
    showShieldedOutflow?: boolean;
    assets?: RegistryAsset[];
    maspAggregates?: AggregatesResponse;
    showInflow?: boolean;
    showOutflow?: boolean;
}

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

export default function MaspTxVolumeChartContainer({
    selectedAsset = "All",
    selectedTimeframe = "24hr",
    showShieldedInflow = true,
    showShieldedOutflow = true,
    assets = [],
    maspAggregates = [],
    showInflow = true,
    showOutflow = true,
}: MaspTxVolumeChartContainerProps) {
    // Initialize with current time and 24 hours ago
    const [value, onChange] = useState<Value>(() => {
        const end = new Date();
        const start = new Date();
        start.setHours(start.getHours() - 24);
        return [start, end];
    });

    // Convert local datetime to UTC ISO string
    const getUTCString = (date: Date | null) => {
        if (!date) return '';
        return date.toISOString();
    };

    // Calculate resolution based on time difference
    const calculateResolution = (start: Date | null, end: Date | null) => {
        if (!start || !end) return 1;
        const hoursDiff = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

        // We want to keep the number of buckets under 48
        // Resolution is in hours, so we divide the total hours by 48 and round up
        const resolution = Math.ceil(hoursDiff / 48);

        // Ensure minimum resolution of 1 hour
        return Math.max(1, resolution);
    };

    // Handle datetime range change
    const handleDateTimeChange = (newValue: Value) => {
        onChange(newValue);
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="section-heading text-center text-xl md:text-2xl">
                MASP Transaction Volume
            </div>

            <div className="flex items-center gap-4 px-4">
                <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-light tracking-[0.4px] text-white/90 pl-2">
                        Time Range
                    </label>
                    <style>{customDateTimePickerStyles}</style>
                    <DateTimeRangePicker
                        onChange={handleDateTimeChange}
                        value={value}
                        className="mb-[-72px] bg-[#3A3A3A] text-white font-light text-[14px] min-w-[170px] h-[26px] text-center rounded-[5px] border border-[#707070] py-[2px] px-2"
                        format="yyyy-MM-dd HH:mm"
                        rangeDivider={<div className="px-2 text-white/70">⇒</div>}
                        disableClock={true}
                        minDate={new Date(2025, 0, 1)} // Set minimum date to January 1, 2025
                        maxDate={new Date()} // Set maximum date to current date
                    />

                </div>
            </div>
            <MaspTxVolumeChart
                selectedAsset={selectedAsset}
                selectedTimeframe={selectedTimeframe}
                showShieldedInflow={showShieldedInflow}
                showShieldedOutflow={showShieldedOutflow}
                assets={assets}
                maspAggregates={maspAggregates}
                showInflow={showInflow}
                showOutflow={showOutflow}
                startTime={getUTCString(Array.isArray(value) ? value[0] : null)}
                endTime={getUTCString(Array.isArray(value) ? value[1] : null)}
                resolution={calculateResolution(Array.isArray(value) ? value[0] : null, Array.isArray(value) ? value[1] : null)}
            />
        </div>
    );
}
