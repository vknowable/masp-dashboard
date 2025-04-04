import ReactECharts from "echarts-for-react";
import { useMemo } from "react";
import { RegistryAsset, ChainMetadata, RegistryIbcMetadata } from "../../../types/chainRegistry";
import { AggregatesResponse, Token, IbcToken as TokenIbcToken } from "../../../types/token";
import { IbcAggregatesWindow } from "./IbcAggregatesChartContainer";
import { denomAmount } from "../../../utils/numbers";
import { useTokenPrices } from "../../../hooks/useTokenPrices";
import { TopLevelFormatterParams } from "echarts/types/dist/shared";
import { RadarSeriesOption, EChartsOption } from "echarts";
import { useIbcTxCount } from "../../../hooks/useIbcData";
import { useTokenList } from "../../../hooks/useTokenList";
import { useRegistryData } from "../../../hooks/useRegistryData";
import { parseIbcConnections } from "../../ibcChannels/IbcChannelsContainer";

interface IbcAggregatesChartProps {
    selectedAssets: string[];
    selectedTimeframe?: IbcAggregatesWindow;
    showShieldedInflow?: boolean;
    showShieldedOutflow?: boolean;
    showTransparentInflow?: boolean;
    showTransparentOutflow?: boolean;
    assets?: RegistryAsset[];
    ibcAggregates?: AggregatesResponse;
}

export default function IbcAggregatesChart({
    selectedAssets,
    selectedTimeframe = "24hr",
    showShieldedInflow = true,
    showShieldedOutflow = true,
    showTransparentInflow = true,
    showTransparentOutflow = true,
    assets = [],
    ibcAggregates: ibcAggregates = [],
}: IbcAggregatesChartProps) {
    // Get the time window based on selected timeframe
    const timeWindow =
        selectedTimeframe === "24hr"
            ? "oneDay"
            : selectedTimeframe === "7d"
                ? "sevenDays"
                : selectedTimeframe === "30d"
                    ? "thirtyDays"
                    : "allTime";

    const displayTimeframe =
        selectedTimeframe === "24hr"
            ? "24 Hours"
            : selectedTimeframe === "7d"
                ? "7 Days"
                : selectedTimeframe === "30d"
                    ? "30 Days"
                    : "All Time";

    const { data: tokenPrices } = useTokenPrices();
    const { data: ibcTxCount } = useIbcTxCount(timeWindow);
    const { data: tokenList = [] } = useTokenList();
    const { registryData } = useRegistryData();

    const filteredData = useMemo(() => {
        // Filter aggregates for the selected time window
        const timeWindowData = ibcAggregates.filter(
            (a) => a.timeWindow === timeWindow
        );

        // If "All" is selected, return data for all assets
        if (selectedAssets.includes("All")) {
            return assets.map((asset) => {
                const assetData = timeWindowData.filter(
                    (a) => a.tokenAddress === asset.address
                );
                const shieldedInflow =
                    assetData.find((a) => a.kind === "shieldedIn")?.totalAmount || "0";
                const shieldedOutflow =
                    assetData.find((a) => a.kind === "shieldedOut")?.totalAmount || "0";
                const transparentInflow =
                    assetData.find((a) => a.kind === "transparentIn")?.totalAmount || "0";
                const transparentOutflow =
                    assetData.find((a) => a.kind === "transparentOut")?.totalAmount || "0";
                // Capitalize all st-based assets => stTIA, stOSMO, stATOM etc
                const symbol =
                    asset.symbol.slice(0, 2) === "st"
                        ? "st" + asset.symbol.slice(2).toUpperCase()
                        : asset.symbol;
                const price =
                    tokenPrices?.price?.find((p) => p.id === asset.coingecko_id)?.usd ??
                    0;

                return {
                    symbol,
                    shieldedInflow: Number(
                        ((denomAmount(parseFloat(shieldedInflow)) ?? 0) * price).toFixed(2)
                    ),
                    shieldedOutflow: Number(
                        ((denomAmount(parseFloat(shieldedOutflow)) ?? 0) * price).toFixed(2)
                    ),
                    transparentInflow: Number(
                        ((denomAmount(parseFloat(transparentInflow)) ?? 0) * price).toFixed(2)
                    ),
                    transparentOutflow: Number(
                        ((denomAmount(parseFloat(transparentOutflow)) ?? 0) * price).toFixed(2)
                    ),
                };
            });
        }

        // Return data for selected assets only
        return assets
            .filter((asset) => selectedAssets.includes(asset.symbol))
            .map((asset) => {
                const assetData = timeWindowData.filter(
                    (a) => a.tokenAddress === asset.address
                );
                const shieldedInflow =
                    assetData.find((a) => a.kind === "shieldedIn")?.totalAmount || "0";
                const shieldedOutflow =
                    assetData.find((a) => a.kind === "shieldedOut")?.totalAmount || "0";
                const transparentInflow =
                    assetData.find((a) => a.kind === "transparentIn")?.totalAmount || "0";
                const transparentOutflow =
                    assetData.find((a) => a.kind === "transparentOut")?.totalAmount || "0";
                const price =
                    tokenPrices?.price?.find((p) => p.id === asset.coingecko_id)?.usd ??
                    0;

                return {
                    symbol: asset.symbol,
                    shieldedInflow: Number(
                        ((denomAmount(parseFloat(shieldedInflow)) ?? 0) * price).toFixed(2)
                    ),
                    shieldedOutflow: Number(
                        ((denomAmount(parseFloat(shieldedOutflow)) ?? 0) * price).toFixed(2)
                    ),
                    transparentInflow: Number(
                        ((denomAmount(parseFloat(transparentInflow)) ?? 0) * price).toFixed(2)
                    ),
                    transparentOutflow: Number(
                        ((denomAmount(parseFloat(transparentOutflow)) ?? 0) * price).toFixed(2)
                    ),
                };
            });
    }, [selectedAssets, selectedTimeframe, assets, ibcAggregates, tokenPrices]);

    const barChartOption = useMemo(
        () => ({
            backgroundColor: "transparent",
            grid: {
                left: "3%",
                right: "4%",
                bottom: "3%",
                containLabel: true,
            },
            xAxis: {
                type: "category" as const,
                data: filteredData.map((d) => d.symbol),
                axisLine: {
                    lineStyle: {
                        color: "#666",
                    },
                },
                axisLabel: {
                    rotate: 0, // Rotate labels 90 degrees (vertical facing up)
                    interval: 0, // Force all labels to show
                    align: "center" as const, // Align text to left side
                    padding: [0, 12, 0, 0], // Add some padding to prevent overlap
                    color: "#CCC", // Match text color with theme
                    fontSize: 15,
                },
                splitLine: {
                    show: true,
                    lineStyle: {
                        type: "dashed" as const,
                        color: "#666",
                    },
                },
            },
            yAxis: {
                type: "value" as const,
                name: "Value (USD)",
                nameLocation: "middle" as const,
                nameGap: 60,
                nameTextStyle: {
                    color: "#CCC",
                    fontSize: 12,
                    padding: [0, 0, 10, 0],
                },
                axisLine: {
                    lineStyle: {
                        color: "#666",
                    },
                },
                axisLabel: {
                    rotate: 0,
                    align: "right" as const,
                    padding: [0, 2, 0, 0],
                    color: "#CCC",
                    fontSize: 12,
                    formatter: (value: number) => `$${value.toLocaleString()}`
                },
                splitLine: {
                    show: false,
                    lineStyle: {
                        type: "dashed" as const,
                        color: "#666",
                    },
                },
            },
            series: [
                {
                    name: "Shielded Inflow",
                    type: "bar" as const,
                    data: showShieldedInflow
                        ? filteredData.map((d) => d.shieldedInflow)
                        : [],
                    itemStyle: {
                        color: "#FFFF00",
                    },
                    barGap: "0%",
                    barCategoryGap: "0%",
                },
                {
                    name: "Shielded Outflow",
                    type: "bar" as const,
                    data: showShieldedOutflow
                        ? filteredData.map((d) => d.shieldedOutflow)
                        : [],
                    itemStyle: {
                        color: "transparent",
                        borderColor: "#FFFF00",
                        borderWidth: 1,
                    },
                    barGap: "0%",
                    barCategoryGap: "0%",
                },
                {
                    name: "Transparent Inflow",
                    type: "bar" as const,
                    data: showTransparentInflow
                        ? filteredData.map((d) => d.transparentInflow)
                        : [],
                    itemStyle: {
                        color: "#4C4C4C",
                    },
                    barGap: "0%",
                    barCategoryGap: "0%",
                },
                {
                    name: "Transparent Outflow",
                    type: "bar" as const,
                    data: showTransparentOutflow
                        ? filteredData.map((d) => d.transparentOutflow)
                        : [],
                    itemStyle: {
                        color: "transparent",
                        borderColor: "#747474",
                        borderWidth: 1,
                    },
                    barGap: "0%",
                    barCategoryGap: "0%",
                },
            ],
            tooltip: {
                trigger: "axis" as const,
                axisPointer: {
                    type: "shadow" as const,
                },
                backgroundColor: "#2A2A2A",
                borderColor: "#707070",
                textStyle: {
                    color: "#FFFFFF",
                },
                formatter: function (params: TopLevelFormatterParams) {
                    if (!Array.isArray(params)) return "";

                    let result = params[0].name + "<br/>";

                    params.forEach((param) => {
                        const value = param.value ?? 0;
                        result +=
                            '<span style="display:inline-block;margin-right:5px;border-radius:10px;width:10px;height:10px;background-color:' +
                            param.color +
                            '"></span>' +
                            param.seriesName +
                            ": $ " +
                            value.toLocaleString() +
                            "<br/>";
                    });

                    return result;
                },
            },
        }),
        [filteredData, showShieldedInflow, showShieldedOutflow, showTransparentInflow, showTransparentOutflow]
    );

    const radarChartOption = useMemo(
        (): EChartsOption => {
            if (!ibcTxCount?.length || !registryData?.ibcMetadata?.length || !tokenList?.length) return {};

            const ibcChannels = parseIbcConnections(registryData, tokenList, ibcTxCount).sort((a, b) => a.chainB.name.localeCompare(b.chainB.name));

            const seriesData = {
                type: 'radar' as const,
                symbol: 'circle' as const,
                symbolSize: 6,
                lineStyle: {
                    width: 2,
                    color: '#FFFF00'
                },
                itemStyle: {
                    color: '#FFFF00'
                },
                emphasis: {
                    areaStyle: {
                        color: 'rgba(255, 255, 0, 0.3)'
                    }
                },
                data: [{
                    value: ibcChannels.map(channel => channel.totalTxs),
                    name: displayTimeframe,
                    areaStyle: {
                        color: 'rgba(255, 255, 0, 0.2)'
                    }
                }]
            };

            const maxValue = Math.max(...seriesData.data[0].value);
            const roundedMax = Math.ceil(maxValue * 1.2 / 5) * 5;

            return {
                backgroundColor: "transparent",
                title: {
                    text: `No. of Transactions (${displayTimeframe})`,
                    left: "center",
                    top: 0,
                    textStyle: {
                        color: "#FFF",
                        fontSize: 16,
                        fontWeight: "normal" as const
                    }
                },
                tooltip: {
                    trigger: 'item',
                    backgroundColor: "#2A2A2A",
                    borderColor: "#707070",
                    textStyle: {
                        color: "#FFFFFF"
                    },
                },
                radar: {
                    center: ['50%', '35%'],
                    radius: '35%',
                    indicator: ibcChannels.map(chain => ({
                        name: chain.chainB.name,
                        max: roundedMax
                    })),
                    splitNumber: 5,
                    axisTick: { show: false },
                    axisLine: {
                        lineStyle: {
                            color: '#666'
                        }
                    },
                    splitLine: {
                        lineStyle: {
                            color: '#666'
                        }
                    },
                    splitArea: {
                        show: true,
                        areaStyle: {
                            color: ['#2A2A2A', '#333333']
                        }
                    },
                    axisLabel: {
                        color: '#CCC',
                        fontSize: 12,
                        padding: [3, 5]
                    },
                    axisName: {
                        color: '#CCC',
                        fontSize: 12,
                        padding: [3, 5]
                    }
                },
                series: seriesData
            };
        },
        [ibcTxCount, registryData, tokenList, selectedTimeframe]
    );

    return (
        <div className="w-full bg-[#191919] rounded-lg p-4 flex gap-4">
            <div className="w-4/5">
                <ReactECharts
                    option={barChartOption}
                    style={{ height: "440px", width: "100%" }}
                    theme="dark"
                />
            </div>
            <div className="w-1/5 flex items-center">
                <ReactECharts
                    option={radarChartOption}
                    style={{ height: "440px", width: "100%" }}
                    theme="dark"
                />
            </div>
        </div>
    );
}
