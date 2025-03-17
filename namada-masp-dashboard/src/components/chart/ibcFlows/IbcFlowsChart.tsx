import ReactECharts from 'echarts-for-react'
import { useMemo } from 'react'
import { RegistryAsset } from '../../../types/chainRegistry'
import { AggregatesResponse } from '../../../types/token'

interface IbcFlowsChartProps {
    selectedAsset?: string
    selectedTimeframe?: '24hr' | '7d' | '30d'
    showShieldedInflow?: boolean
    showShieldedOutflow?: boolean
    showTransparentInflow?: boolean
    showTransparentOutflow?: boolean
    assets?: RegistryAsset[]
    maspAggregates?: AggregatesResponse
}

export default function IbcFlowsChart({
    selectedAsset = 'All',
    selectedTimeframe = '24hr',
    showShieldedInflow = true,
    showShieldedOutflow = true,
    showTransparentInflow = true,
    showTransparentOutflow = true,
    assets = [],
    maspAggregates = []
}: IbcFlowsChartProps) {
    const filteredData = useMemo(() => {
        // Get the time window based on selected timeframe
        const timeWindow = selectedTimeframe === '24hr' ? 'oneDay'
            : selectedTimeframe === '7d' ? 'sevenDays'
                : 'thirtyDays'

        // Filter aggregates for the selected time window
        const timeWindowData = maspAggregates.filter(a => a.timeWindow === timeWindow)

        // If "All" is selected, return data for all assets
        if (selectedAsset === 'All') {
            return assets.map(asset => {
                const assetData = timeWindowData.filter(a => a.tokenAddress === asset.address)
                const inflow = assetData.find(a => a.kind === 'inflows')?.totalAmount || '0'
                const outflow = assetData.find(a => a.kind === 'outflows')?.totalAmount || '0'

                return {
                    symbol: asset.symbol,
                    shieldedInflow: parseFloat(inflow),
                    shieldedOutflow: parseFloat(outflow),
                    transparentInflow: 0, // TODO: Add transparent flow data when available
                    transparentOutflow: 0
                }
            })
        }

        // Return data for selected asset only
        const asset = assets.find(a => a.symbol === selectedAsset)
        if (!asset) return []

        const assetData = timeWindowData.filter(a => a.tokenAddress === asset.address)
        const inflow = assetData.find(a => a.kind === 'inflows')?.totalAmount || '0'
        const outflow = assetData.find(a => a.kind === 'outflows')?.totalAmount || '0'

        return [{
            symbol: asset.symbol,
            shieldedInflow: parseFloat(inflow),
            shieldedOutflow: parseFloat(outflow),
            transparentInflow: 0, // TODO: Add transparent flow data when available
            transparentOutflow: 0
        }]
    }, [selectedAsset, selectedTimeframe, assets, maspAggregates])

    const option = useMemo(() => ({
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
        },
        xAxis: {
            type: 'category' as const,
            data: filteredData.map(d => d.symbol),
            axisLine: {
                lineStyle: {
                    color: '#666'
                }
            },
            splitLine: {
                show: true,
                lineStyle: {
                    type: 'dashed' as const,
                    color: '#666'
                }
            }
        },
        yAxis: {
            type: 'value' as const,
            name: 'Amount',
            axisLine: {
                lineStyle: {
                    color: '#666'
                }
            },
            splitLine: {
                show: true,
                lineStyle: {
                    type: 'dashed' as const,
                    color: '#666'
                }
            }
        },
        series: [
            {
                name: 'Shielded Inflow',
                type: 'bar' as const,
                data: showShieldedInflow ? filteredData.map(d => d.shieldedInflow) : [],
                itemStyle: {
                    color: '#FFFF00'
                },
            },
            {
                name: 'Shielded Outflow',
                type: 'bar' as const,
                data: showShieldedOutflow ? filteredData.map(d => d.shieldedOutflow) : [],
                itemStyle: {
                    color: '#666666'
                },
            },
            {
                name: 'Transparent Inflow',
                type: 'bar' as const,
                data: showTransparentInflow ? filteredData.map(d => d.transparentInflow) : [],
                itemStyle: {
                    color: 'transparent',
                    borderColor: '#FFFF00',
                    borderWidth: 2,
                    borderType: 'solid' as const
                },
            },
            {
                name: 'Transparent Outflow',
                type: 'bar' as const,
                data: showTransparentOutflow ? filteredData.map(d => d.transparentOutflow) : [],
                itemStyle: {
                    color: 'transparent',
                    borderColor: '#666666',
                    borderWidth: 2,
                    borderType: 'solid' as const
                },
            }
        ],
        tooltip: {
            trigger: 'axis' as const,
            axisPointer: {
                type: 'shadow' as const
            }
        }
    }), [filteredData, showShieldedInflow, showShieldedOutflow, showTransparentInflow, showTransparentOutflow])

    return (
        <div className="w-full h-[440px] bg-[#191919] rounded-lg p-4">
            <ReactECharts
                option={option}
                style={{ height: '100%', width: '100%' }}
                theme="dark"
            />
        </div>
    )
}