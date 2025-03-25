import ReactECharts from "echarts-for-react";
import { useMemo } from "react";
import { RegistryAsset } from "../../../types/chainRegistry";
import { AggregatesResponse } from "../../../types/token";
import { MaspAggregatesWindow } from "./MaspTxVolumeChartContainer";
import { denomAmount } from "../../../utils/numbers";
import { useTokenPrices } from "../../../hooks/useTokenPrices";
import { TooltipFormatterCallback, TopLevelFormatterParams } from 'echarts/types/dist/shared';

interface MaspTxVolumeChartProps {
    selectedAsset?: string;
    selectedTimeframe?: MaspAggregatesWindow;
    showShieldedInflow?: boolean;
    showShieldedOutflow?: boolean;
    assets?: RegistryAsset[];
    maspAggregates?: AggregatesResponse;
}

export default function MaspTxVolumeChart({
    selectedAsset = "All",
    selectedTimeframe = "24hr",
    showShieldedInflow = true,
    showShieldedOutflow = true,
    assets = [],
    maspAggregates = [],
}: MaspTxVolumeChartProps) {
    const { data: tokenPrices } = useTokenPrices();

    const filteredData = useMemo(() => {
        // Get the time window based on selected timeframe
        const timeWindow =
            selectedTimeframe === "24hr"
                ? "oneDay"
                : selectedTimeframe === "7d"
                    ? "sevenDays"
                    : selectedTimeframe === "30d"
                        ? "thirtyDays"
                        : "allTime";

        // Filter aggregates for the selected time window
        const timeWindowData = maspAggregates.filter(
            (a) => a.timeWindow === timeWindow
        );

        // If "All" is selected, return data for all assets
        if (selectedAsset === "All") {
            return assets.map((asset) => {
                const assetData = timeWindowData.filter(
                    (a) => a.tokenAddress === asset.address
                );
                const inflow =
                    assetData.find((a) => a.kind === "inflows")?.totalAmount || "0";
                const outflow =
                    assetData.find((a) => a.kind === "outflows")?.totalAmount || "0";
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
                        ((denomAmount(parseFloat(inflow)) ?? 0) * price).toFixed(2)
                    ),
                    shieldedOutflow: Number(
                        ((denomAmount(parseFloat(outflow)) ?? 0) * price).toFixed(2)
                    ),
                };
            });
        }

        // Return data for selected asset only
        const asset = assets.find((a) => a.symbol === selectedAsset);
        if (!asset) return [];

        const assetData = timeWindowData.filter(
            (a) => a.tokenAddress === asset.address
        );
        const inflow =
            assetData.find((a) => a.kind === "inflows")?.totalAmount || "0";
        const outflow =
            assetData.find((a) => a.kind === "outflows")?.totalAmount || "0";
        console.log(inflow, outflow, "in out");
        return [
            {
                symbol: asset.symbol,
                shieldedInflow: parseFloat(inflow),
                shieldedOutflow: parseFloat(outflow),
                transparentInflow: 0, // TODO: Add transparent flow data when available
                transparentOutflow: 0,
            },
        ];
    }, [selectedAsset, selectedTimeframe, assets, maspAggregates]);

    const option = useMemo(
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
                    rotate: 90, // Rotate labels 90 degrees (vertical facing up)
                    interval: 0, // Force all labels to show
                    align: "right" as const, // Align text to left side
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
                axisLine: {
                    lineStyle: {
                        color: "#666",
                    },
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
                        color: "#666666",
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
                    if (!Array.isArray(params)) return '';

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
        [filteredData, showShieldedInflow, showShieldedOutflow]
    );

    return (
        <div className="w-full h-[440px] bg-[#191919] rounded-lg p-4">
            <ReactECharts
                option={option}
                style={{ height: "100%", width: "100%" }}
                theme="dark"
            />
        </div>
    );
}
