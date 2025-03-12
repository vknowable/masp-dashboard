import ReactECharts from 'echarts-for-react'
import { useMemo } from 'react'
import { RegistryAsset } from '../../../types/chainRegistry'
import { AggregatesResponse } from '../../../types/token'
import { MaspAggregatesWindow } from './MaspAggregatesChartContainer'
import { denomAmount } from '../../../utils/numbers'

interface MaspAggregatesChartProps {
  selectedAsset?: string
  selectedTimeframe?: MaspAggregatesWindow
  showShieldedInflow?: boolean
  showShieldedOutflow?: boolean
  assets?: RegistryAsset[]
  maspAggregates?: AggregatesResponse
}

export default function MaspAggregatesChart({
  selectedAsset = 'All',
  selectedTimeframe = '24hr',
  showShieldedInflow = true,
  showShieldedOutflow = true,
  assets = [],
  maspAggregates = []
}: MaspAggregatesChartProps) {
  const filteredData = useMemo(() => {
    // Get the time window based on selected timeframe
    const timeWindow = selectedTimeframe === '24hr' ? 'oneDay' 
      : selectedTimeframe === '7d' ? 'sevenDays' 
      : selectedTimeframe === '30d' ? 'thirtyDays'
      : 'allTime'

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
          shieldedInflow: denomAmount(parseFloat(inflow)),
          shieldedOutflow: denomAmount(parseFloat(outflow)),
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
    backgroundColor: 'transparent',
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: filteredData.map(d => d.symbol),
      axisLine: {
        lineStyle: {
          color: '#666'
        }
      },
      axisLabel: {
        rotate: 90,  // Rotate labels 90 degrees (vertical facing up)
        interval: 0, // Force all labels to show
        align: 'right', // Align text to left side
        padding: [0, 12, 0, 0], // Add some padding to prevent overlap
        color: '#CCC', // Match text color with theme
        fontSize: 15,
      },
      splitLine: {
        show: true,
        lineStyle: {
          type: 'dashed',
          color: '#666'
        }
      }
    },
    yAxis: {
      type: 'value',
      axisLine: {
        lineStyle: {
          color: '#666'
        }
      },
      splitLine: {
        show: false,
        lineStyle: {
          type: 'dashed',
          color: '#666'
        }
      }
    },
    series: [
      {
        name: 'Shielded Inflow',
        type: 'bar',
        data: showShieldedInflow ? filteredData.map(d => d.shieldedInflow) : [],
        itemStyle: {
          color: '#FFFF00'
        },
        barGap: '0%',
        barCategoryGap: '0%'
      },
      {
        name: 'Shielded Outflow',
        type: 'bar',
        data: showShieldedOutflow ? filteredData.map(d => d.shieldedOutflow) : [],
        itemStyle: {
          color: '#666666'
        },
        barGap: '0%',
        barCategoryGap: '0%'
      },
    ],
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      backgroundColor: '#2A2A2A',
      borderColor: '#707070',
      textStyle: {
        color: '#FFFFFF'
      }
    }
  }), [filteredData, showShieldedInflow, showShieldedOutflow])

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