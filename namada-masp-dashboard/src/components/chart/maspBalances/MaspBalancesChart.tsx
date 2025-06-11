import ReactECharts from "echarts-for-react";
import { useMemo, useRef, useState, useEffect } from "react";
import { RegistryAsset } from "../../../types/chainRegistry";
import { useTokenPrices } from "../../../hooks/useTokenPrices";
import { useMaspBalanceSeries } from "../../../hooks/useMaspBalanceSeries";
import { TooltipFormatterCallback, TopLevelFormatterParams } from 'echarts/types/dist/shared';
import { EChartsOption } from 'echarts';

// Define types for pie chart data
interface PieDataItem {
    name: string;
    value: number;
    formattedValue: string;
    itemStyle?: { color: string };
}

// Define a more specific type for the series
type SeriesItem = {
    name: string;
    type: "line";
    data: number[];
    showSymbol: boolean;
    emphasis?: { focus: "series" };
    lineStyle?: { width: number; type: "solid" | "dashed" };
    itemStyle?: { color: string };
} | {
    name: string;
    type: "pie";
    radius: string;
    center: [string, string];
    data: PieDataItem[];
    emphasis: { focus: "self" };
    label: {
        formatter?: string;
        color?: string;
        show?: boolean;
    };
    tooltip?: {
        formatter: string | ((params: any) => string);
        backgroundColor?: string;
        borderColor?: string;
        textStyle?: {
            color: string;
        };
    };
};

interface MaspBalancesChartProps {
    assets?: RegistryAsset[];
    startTime: string;
    endTime: string;
    resolution?: number;
}

export default function MaspBalancesChart({
    assets = [],
    startTime,
    endTime,
    resolution = 1,
}: MaspBalancesChartProps) {
    const { data: tokenPrices } = useTokenPrices();
    const { data: balanceSeriesResponse } = useMaspBalanceSeries(startTime, endTime, resolution);
    const chartRef = useRef<any>(null);
    const [currentTimeIndex, setCurrentTimeIndex] = useState<number>(0);

    // Update currentTimeIndex when data becomes available
    useEffect(() => {
        if (balanceSeriesResponse?.series?.length) {
            setCurrentTimeIndex(balanceSeriesResponse.series.length - 1);
        }
    }, [balanceSeriesResponse]);

    // Define a consistent color palette for both charts
    const colorPalette = useMemo(() => {
        return [
            '#FFFF00', '#00D4D4', '#D4A0D4', '#90D490', '#D46B4A',
            '#4A6AD4', '#D490B4', '#4AD44A', '#A090D4', '#20A0A0',
            '#D4B000', '#D46B4A', '#7B68D4', '#00A0A0',
        ];
    }, []);

    // Process token balances data
    const { tokenBalances, tokenExponents, tokenPriceMap, timeLabels, totalValues } = useMemo(() => {
        const balanceSeries = balanceSeriesResponse?.series ?? [];
        const tokenBalances = new Map<string, number[]>();
        const tokenExponents = new Map<string, number>();
        const tokenPriceMap = new Map<string, number>();
        const totalValues: number[] = [];

        // Format time only (HH:mm UTC)
        const formatTime = (date: Date) => {
            return date.toISOString()
                .split('T')[1]
                .replace(/:\d{2}\.\d{3}Z/, '')
                .concat(' UTC');
        };

        // Format full date and time
        const formatDateTime = (date: Date) => {
            return date.toISOString()
                .replace('T', '    ')
                .replace(/:\d{2}\.\d{3}Z/, '')
                .concat(' UTC');
        };

        // Get UTC date string (YYYY-MM-DD) for comparison
        const getUTCDateString = (date: Date) => {
            return date.toISOString().split('T')[0];
        };

        // Generate time labels using actual timestamps
        const timeLabels = balanceSeries.map((entry, index) => {
            const time = new Date(entry.timestamp);

            // Get previous time if it exists
            let prevTime;
            if (index > 0) {
                prevTime = new Date(balanceSeries[index - 1].timestamp);
            }

            // Show date if it's the first item or if the date has changed
            if (index === 0 || (prevTime && getUTCDateString(prevTime) !== getUTCDateString(time))) {
                return formatDateTime(time);
            }
            return formatTime(time);
        });

        // First pass: collect unique tokens, their exponents, and prices
        balanceSeries.forEach(entry => {
            entry.balances.forEach(balance => {
                // Only process tokens that exist in the registry
                const asset = assets.find(a => a.address === balance.token);
                if (asset) {
                    if (!tokenExponents.has(balance.token)) {
                        const exponent = asset.denom_units?.find(
                            (unit) => unit.denom === asset.display
                        )?.exponent ?? 6;
                        tokenExponents.set(balance.token, exponent);

                        // Get token price
                        const coingeckoId = asset.coingecko_id;
                        const price = tokenPrices?.price?.find(p => p.id === coingeckoId)?.usd ?? 0;
                        tokenPriceMap.set(balance.token, price);
                    }
                }
            });
        });

        // Second pass: collect USD values for each token
        balanceSeries.forEach(entry => {
            entry.balances.forEach(balance => {
                // Only process tokens that exist in the registry
                const asset = assets.find(a => a.address === balance.token);
                if (asset) {
                    const exponent = tokenExponents.get(balance.token) ?? 6;
                    const price = tokenPriceMap.get(balance.token) ?? 0;
                    const amount = (Number(balance.raw_amount) / 10 ** exponent) * price;

                    if (!tokenBalances.has(balance.token)) {
                        tokenBalances.set(balance.token, []);
                    }
                    tokenBalances.get(balance.token)?.push(amount);
                }
            });
        });

        // Calculate total values
        const numTimePoints = balanceSeries.length;
        for (let i = 0; i < numTimePoints; i++) {
            let total = 0;
            for (const [_, balances] of tokenBalances.entries()) {
                total += balances[i] || 0;
            }
            totalValues.push(total);
        }

        return { tokenBalances, tokenExponents, tokenPriceMap, timeLabels, totalValues };
    }, [balanceSeriesResponse, assets, tokenPrices]);

    // Create line chart series
    const lineSeries = useMemo(() => {
        const series: SeriesItem[] = Array.from(tokenBalances.entries()).map(([token, balances], index) => {
            const asset = assets.find(a => a.address === token);
            return {
                name: asset?.symbol ?? token,
                type: "line" as const,
                data: balances,
                showSymbol: false,
                emphasis: { focus: "series" as const },
                itemStyle: {
                    color: colorPalette[index % colorPalette.length],
                },
            };
        });

        // Add the total series with a thicker line
        series.push({
            name: "Total",
            type: "line" as const,
            data: totalValues,
            showSymbol: false,
            lineStyle: {
                width: 3,
                type: "dashed" as const,
            },
            itemStyle: {
                color: "#DDC", // White color for the total line
            },
        });

        return series;
    }, [tokenBalances, assets, totalValues, colorPalette]);

    // Create pie chart data for the current time index
    const pieData = useMemo(() => {
        const pieData: PieDataItem[] = Array.from(tokenBalances.entries()).map(([token, balances], index) => {
            const asset = assets.find(a => a.address === token);
            const value = balances[currentTimeIndex ?? 0] || 0;
            return {
                name: asset?.symbol ?? token,
                value: value,
                formattedValue: `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
                itemStyle: {
                    color: colorPalette[index % colorPalette.length],
                },
            };
        });
        return pieData;
    }, [tokenBalances, assets, currentTimeIndex, colorPalette]);

    // Create the chart option
    const option = useMemo(() => {
        // Create the pie chart series
        const pieSeries: SeriesItem = {
            name: "Distribution",
            type: "pie" as const,
            radius: "30%",
            center: ["80%", "35%"],
            data: pieData,
            emphasis: {
                focus: "self" as const,
                label: {
                    show: true,
                },
                itemStyle: {
                    shadowBlur: 10,
                    shadowOffsetX: 0,
                    shadowColor: 'rgba(0, 0, 0, 0.5)',
                },
            },
            label: {
                show: true,
                formatter: '{b}: {d}%',
                color: '#FFFFFF',
                fontSize: 11,
                position: 'outside',
                distanceToLabelLine: 2,
                alignTo: 'none',
                edgeDistance: '10%',
                bleedMargin: 5,
                lineHeight: 15,
                rich: {},
                showLine: true,
                lineStyle: {
                    color: '#666',
                    width: 1,
                    type: 'solid',
                },
            },
            tooltip: {
                formatter: (params: any) => {
                    const data = params.data;
                    const percent = params.percent;
                    return `${data.name}: ${percent}% (${data.formattedValue})`;
                },
                backgroundColor: "#2A2A2A",
                borderColor: "#707070",
                textStyle: {
                    color: "#FFFFFF",
                },
            },
        } as any; // Use type assertion to bypass type checking for now

        // Combine all series
        const allSeries = [...lineSeries, pieSeries];

        return {
            backgroundColor: "transparent",
            color: colorPalette, // Apply the color palette to the chart
            title: {
                text: window.innerWidth < 1100 ? "" : "Value Distribution",
                left: "82%",
                textAlign: "center",
                top: window.innerWidth < 1400 ? 30 : 14,
                textStyle: {
                    color: "#FFF",
                    fontSize: 16,
                    fontWeight: "normal" as const
                }
            },
            grid: {
                left: "6%",
                right: window.innerWidth < 1100 ? "12%" : "40%",
                bottom: "3%",
                top: window.innerWidth < 1400 ? 60 : 10,
                containLabel: true,
            },
            xAxis: {
                type: "category" as const,
                boundaryGap: false,
                data: timeLabels,
                axisLine: {
                    lineStyle: {
                        color: "#666",
                    },
                },
                axisTick: {
                    alignWithLabel: true
                },
                axisLabel: {
                    rotate: 90,
                    interval: window.innerWidth < 1400 ? 3 : 0, // Show every 3rd label on mobile
                    align: "right" as const,
                    padding: [0, 12, 0, 0],
                    color: "#CCC",
                    fontSize: 12,
                },
                splitLine: {
                    show: true,
                    lineStyle: {
                        type: "dashed" as const,
                        color: "#444",
                    },
                },
            },
            yAxis: {
                type: "value" as const,
                name: "Value (USD)",
                nameLocation: "middle" as const,
                nameGap: 80,
                axisLine: {
                    lineStyle: {
                        color: "#666",
                    },
                },
                axisLabel: {
                    color: "#CCC",
                    formatter: (value: number) => `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
                },
                splitLine: {
                    show: true,
                    lineStyle: {
                        type: "dashed" as const,
                        color: "#666",
                    },
                },
            },
            series: window.innerWidth < 1100 ? lineSeries : allSeries,
            tooltip: {
                trigger: "axis" as const,
                axisPointer: {
                    type: "line" as const,
                },
                backgroundColor: "#2A2A2A",
                borderColor: "#707070",
                textStyle: {
                    color: "#FFFFFF",
                },
                formatter: function (params: TopLevelFormatterParams) {
                    if (!Array.isArray(params)) return '';

                    let result = params[0].name + "<br/>";

                    params.forEach((param) => {
                        const value = param.value ?? 0;
                        result +=
                            '<span style="display:inline-block;margin-right:5px;border-radius:10px;width:10px;height:10px;background-color:' +
                            param.color +
                            '"></span>' +
                            param.seriesName +
                            ": $" +
                            value.toLocaleString(undefined, { maximumFractionDigits: 2 }) +
                            "<br/>";
                    });

                    return result;
                },
            },
            legend: {
                data: lineSeries.map(s => s.name),
                textStyle: {
                    color: "#CCC",
                },
                align: 'right' as const,
                orient: window.innerWidth < 1400 ? 'horizontal' as const : 'vertical' as const,
                top: 0,
                right: 0,
            },
        } as EChartsOption;
    }, [lineSeries, pieData, timeLabels, colorPalette]);

    return (
        <div className="w-full h-[480px] bg-[#191919] rounded-lg p-4">
            <ReactECharts
                ref={chartRef}
                option={option}
                style={{ height: "100%", width: "100%" }}
                theme="dark"
                onEvents={{
                    updateAxisPointer: (params: any) => {
                        const xAxisInfo = params.axesInfo[0];
                        if (xAxisInfo) {
                            const index = xAxisInfo.value;
                            if (index >= 0 && index < (balanceSeriesResponse?.series?.length || 0)) {
                                setCurrentTimeIndex(index);
                            }
                        }
                    }
                }}
            />
        </div>
    );
}
