import { useState } from 'react';
import MaspBalancesChart from './MaspBalancesChart';
import { RegistryAsset } from '../../../types/chainRegistry';
import DateTimeRangePicker from '@wojtekmaj/react-datetimerange-picker';
import '@wojtekmaj/react-datetimerange-picker/dist/DateTimeRangePicker.css';
import 'react-calendar/dist/Calendar.css';
import { customDateTimePickerStyles } from '../DateTimePickerStyles';

interface MaspBalancesChartContainerProps {
    isLoading?: boolean;
    error?: Error | null;
    assets?: RegistryAsset[];
}

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

export default function MaspBalancesChartContainer({
    isLoading = false,
    error = null,
    assets = [],
}: MaspBalancesChartContainerProps) {
    // Initialize with current time and 24 hours ago
    const [value, onChange] = useState<Value>(() => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 30);
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

    if (isLoading) {
        return (
            <div className="px-4 py-4">
                <div className="rounded-[5px] bg-[#F5F5F5] dark:bg-[#191919] min-w-full min-h-[508px] pt-2 px-2">
                    <div className="min-h-[36px] animate-pulse bg-[#2A2A2A] rounded-lg mb-4" />
                    <div className="h-[440px] animate-pulse bg-[#2A2A2A] rounded-lg" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="px-4 py-4">
                <div className="rounded-[5px] bg-[#F5F5F5] dark:bg-[#191919] min-w-full p-4">
                    <div className="text-red-400 bg-red-900/20 rounded-lg p-4">
                        Error loading chart data: {error.message}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="section-heading text-center text-xl md:text-2xl">
                MASP Assets Over Time
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
                        className="bg-[#3A3A3A] text-white font-light text-[14px] min-w-[170px] h-[26px] text-center rounded-[5px] border border-[#707070] mb-2"
                        format="yyyy-MM-dd HH:mm"
                        rangeDivider={<div className="px-2 text-white/70">⇒</div>}
                        disableClock={true}
                        minDate={new Date(2025, 0, 1)} // Set minimum date to January 1, 2025
                        maxDate={new Date()} // Set maximum date to current date
                    />

                </div>
            </div>
            <MaspBalancesChart
                assets={assets}
                startTime={getUTCString(Array.isArray(value) ? value[0] : null)}
                endTime={getUTCString(Array.isArray(value) ? value[1] : null)}
                resolution={calculateResolution(Array.isArray(value) ? value[0] : null, Array.isArray(value) ? value[1] : null)}
            />
        </div>
    );
}
