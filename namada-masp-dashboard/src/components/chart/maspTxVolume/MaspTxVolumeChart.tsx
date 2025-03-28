import ReactECharts from "echarts-for-react";
import { useMemo } from "react";
import { RegistryAsset } from "../../../types/chainRegistry";
import { useTokenPrices } from "../../../hooks/useTokenPrices";
import { useMaspTxVolume } from "../../../hooks/useMaspTxVolume";
import { TooltipFormatterCallback, TopLevelFormatterParams } from 'echarts/types/dist/shared';

interface MaspTxVolumeChartProps {
    assets?: RegistryAsset[];
    startTime: string;
    endTime: string;
    resolution?: number;
}

export default function MaspTxVolumeChart({
    assets = [],
    startTime,
    endTime,
    resolution = 1,
}: MaspTxVolumeChartProps) {
    const { data: tokenPrices } = useTokenPrices();
    const { data: txVolume } = useMaspTxVolume(startTime, endTime, resolution);

    const option = useMemo(
        () => {
            // Calculate net values for each bucket
            const netValues = txVolume?.map(bucket => {
                const metadata = (tokenAddress: string) => {
                    const asset = assets?.find(a => a.address === tokenAddress);
                    const id = asset?.coingecko_id;
                    const exponent =
                        asset?.denom_units?.find((unit) => unit.denom === asset.display)
                            ?.exponent ?? 6;
                    const price = tokenPrices?.price?.find(p => p.id === id)?.usd ?? 0;
                    return { price, exponent };
                }

                // Calculate total value of inflow transactions
                const inValue = bucket.in.reduce((total, tx) => {
                    const { price, exponent } = metadata(tx.token_address);
                    return total + (tx.raw_amount / 10 ** exponent * price);
                }, 0);

                // Calculate total value of outflow transactions
                const outValue = bucket.out.reduce((total, tx) => {
                    const { price, exponent } = metadata(tx.token_address);
                    return total + (tx.raw_amount / 10 ** exponent * price);
                }, 0);

                return inValue - outValue;
            }) || [];

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

            // Generate time labels for each bucket
            const timeLabels = txVolume?.map((bucket, index) => {
                const time = new Date(startTime);
                time.setUTCHours(time.getUTCHours() + (bucket.bucket * resolution));

                // Get previous time if it exists
                let prevTime;
                if (index > 0) {
                    prevTime = new Date(startTime);
                    prevTime.setUTCHours(prevTime.getUTCHours() + ((bucket.bucket - 1) * resolution));
                }

                // Show date if it's the first item or if the date has changed
                if (index === 0 || (prevTime && getUTCDateString(prevTime) !== getUTCDateString(time))) {
                    return formatDateTime(time);
                }
                return formatTime(time);
            }) || [];

            // find the max net value
            const maxNetValue = Math.max(...netValues.map(Math.abs));

            return {
                backgroundColor: "transparent",
                grid: {
                    left: "6%",
                    right: 150,
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
                yAxis: [
                    {
                        type: "value" as const,
                        name: "No. of Transactions",
                        nameLocation: "middle" as const,
                        nameGap: 50,
                        position: 'left' as const,
                        axisLine: {
                            lineStyle: {
                                color: "#666",
                            },
                        },
                        axisLabel: {
                            color: "#CCC",
                            formatter: (value: number) => value.toFixed(0),
                        },
                        splitLine: {
                            show: true,
                            lineStyle: {
                                type: "dashed" as const,
                                color: "#666",
                            },
                        },
                    },
                    {
                        type: "value" as const,
                        name: "Net Tx Value (USD)",
                        nameLocation: "middle" as const,
                        nameGap: 60,
                        position: 'right' as const,
                        min: 0,
                        max: maxNetValue,
                        axisLine: {
                            lineStyle: {
                                color: "#666",
                            },
                        },
                        axisLabel: {
                            color: "#CCC",
                            formatter: (value: number) => `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
                        },
                        splitLine: {
                            show: false,
                        },
                    }
                ],
                series: [
                    {
                        name: "Inflow Txs",
                        type: "line" as const,
                        yAxisIndex: 0,
                        data: txVolume?.map(bucket => bucket.in.length) || [],
                        itemStyle: {
                            color: "#FFFF00",
                        },
                        showSymbol: false,
                        z: 3,
                    },
                    {
                        name: "Outflow Txs",
                        type: "line" as const,
                        yAxisIndex: 0,
                        data: txVolume?.map(bucket => bucket.out.length) || [],
                        itemStyle: {
                            color: "#AAA",
                        },
                        showSymbol: false,
                        z: 2,
                    },
                    {
                        name: "Net Value",
                        type: "bar" as const,
                        yAxisIndex: 1,
                        data: netValues.map(value => Math.abs(value)),
                        itemStyle: {
                            color: (params: any) => {
                                const originalValue = netValues[params.dataIndex];
                                return originalValue >= 0 ? 'rgba(100, 255, 250, 0.25)' : 'rgba(255, 0, 0, 0.35)';
                            }
                        },
                        // Add color for legend
                        color: 'rgba(100, 255, 250, 0.25)',
                        z: 1,
                    }
                ],
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
                            const value = param.seriesName === "Net Value"
                                ? netValues[param.dataIndex]
                                : (param.value ?? 0);
                            const formattedValue = param.seriesName === "Net Value"
                                ? `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
                                : value.toLocaleString();

                            result +=
                                '<span style="display:inline-block;margin-right:5px;border-radius:10px;width:10px;height:10px;background-color:' +
                                param.color +
                                '"></span>' +
                                param.seriesName +
                                ": " +
                                formattedValue +
                                "<br/>";
                        });

                        return result;
                    },
                },
                legend: {
                    data: ["Inflow Txs", "Outflow Txs", "Net Value"],
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
        [txVolume, tokenPrices]
    );

    return (
        <div className="w-full h-[480px] bg-[#191919] rounded-lg p-4">
            <ReactECharts
                option={option}
                style={{ height: "100%", width: "100%" }}
                theme="dark"
            />
        </div>
    );
}
