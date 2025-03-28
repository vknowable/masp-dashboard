import ReactECharts from "echarts-for-react";
import { useMemo } from "react";
import { RegistryAsset } from "../../../types/chainRegistry";
import { useTokenPrices } from "../../../hooks/useTokenPrices";
import { useMaspBalanceSeries } from "../../../hooks/useMaspBalanceSeries";
import { TooltipFormatterCallback, TopLevelFormatterParams } from 'echarts/types/dist/shared';

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

    const option = useMemo(
        () => {
            const balanceSeries = balanceSeriesResponse?.series ?? [];

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

            // Get unique tokens and their balances over time
            const tokenBalances = new Map<string, number[]>();
            const tokenExponents = new Map<string, number>();
            const tokenPriceMap = new Map<string, number>();

            // First pass: collect unique tokens, their exponents, and prices
            balanceSeries.forEach(entry => {
                entry.balances.forEach(balance => {
                    if (!tokenExponents.has(balance.token)) {
                        const asset = assets.find(a => a.address === balance.token);
                        const exponent = asset?.denom_units?.find(
                            (unit) => unit.denom === asset.display
                        )?.exponent ?? 6;
                        tokenExponents.set(balance.token, exponent);

                        // Get token price
                        const coingeckoId = asset?.coingecko_id;
                        const price = tokenPrices?.price?.find(p => p.id === coingeckoId)?.usd ?? 0;
                        tokenPriceMap.set(balance.token, price);
                    }
                });
            });

            // Second pass: collect USD values for each token
            balanceSeries.forEach(entry => {
                entry.balances.forEach(balance => {
                    const exponent = tokenExponents.get(balance.token) ?? 6;
                    const price = tokenPriceMap.get(balance.token) ?? 0;
                    const amount = (Number(balance.raw_amount) / 10 ** exponent) * price;

                    if (!tokenBalances.has(balance.token)) {
                        tokenBalances.set(balance.token, []);
                    }
                    tokenBalances.get(balance.token)?.push(amount);
                });
            });

            // Create series for each token
            const series = Array.from(tokenBalances.entries()).map(([token, balances]) => {
                const asset = assets.find(a => a.address === token);
                return {
                    name: asset?.symbol ?? token,
                    type: "line" as const,
                    data: balances,
                    showSymbol: false,
                };
            });

            return {
                backgroundColor: "transparent",
                grid: {
                    left: "6%",
                    right: 100,
                    bottom: "3%",
                    top: 10,
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
                        interval: 0,
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
                series,
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
                    data: series.map(s => s.name),
                    textStyle: {
                        color: "#CCC",
                    },
                    align: 'right' as const,
                    orient: 'vertical' as const,
                    top: 0,
                    right: 0,
                },
            };
        },
        [balanceSeriesResponse, assets]
    );

    return (
        <div className="w-full h-[480px] bg-[#191919] rounded-lg p-4 mt-[-32px]">
            <ReactECharts
                option={option}
                style={{ height: "100%", width: "100%" }}
                theme="dark"
            />
        </div>
    );
}
