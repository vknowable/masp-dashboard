import ReactECharts from 'echarts-for-react'
import { useEffect, useMemo, useState } from 'react'

// Placeholder data structure
interface AssetFlow {
  symbol: string
  shieldedInflow: number
  shieldedOutflow: number
  transparentInflow: number
  transparentOutflow: number
}

const placeholderData: AssetFlow[] = [
  {
    symbol: 'ATOM',
    shieldedInflow: 2000000,
    shieldedOutflow: 1500000,
    transparentInflow: 1800000,
    transparentOutflow: 1200000
  },
  {
    symbol: 'OSMO',
    shieldedInflow: 1200000,
    shieldedOutflow: 800000,
    transparentInflow: 1000000,
    transparentOutflow: 900000
  },
  {
    symbol: 'TIA',
    shieldedInflow: 1500000,
    shieldedOutflow: 1100000,
    transparentInflow: 1300000,
    transparentOutflow: 1000000
  },
  {
    symbol: 'INJ',
    shieldedInflow: 1700000,
    shieldedOutflow: 1400000,
    transparentInflow: 1600000,
    transparentOutflow: 1100000
  }
]

interface ChartProps {
  selectedAsset?: string
  selectedTimeframe?: '24hr' | '7d' | '30d'
  showShieldedInflow?: boolean
  showShieldedOutflow?: boolean
  showTransparentInflow?: boolean
  showTransparentOutflow?: boolean
}

export default function Chart({
  selectedAsset = 'All',
  selectedTimeframe = '24hr',
  showShieldedInflow = true,
  showShieldedOutflow = true,
  showTransparentInflow = true,
  showTransparentOutflow = true
}: ChartProps) {
  const filteredData = useMemo(() => {
    if (selectedAsset === 'All') return placeholderData
    return placeholderData.filter(d => d.symbol === selectedAsset)
  }, [selectedAsset])

  const option = {
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
      name: '2m',
      axisLine: {
        lineStyle: {
          color: '#666'
        }
      },
      splitLine: {
        show: true,
        lineStyle: {
          type: 'dashed',
          color: '#666'
        }
      }
    },
    series: [
      showShieldedInflow && {
        name: 'Shielded Inflow',
        type: 'bar',
        data: filteredData.map(d => d.shieldedInflow),
        itemStyle: {
          color: '#FFFF00'
        }
      },
      showShieldedOutflow && {
        name: 'Shielded Outflow',
        type: 'bar',
        data: filteredData.map(d => d.shieldedOutflow),
        itemStyle: {
          color: '#666666'
        }
      },
      showTransparentInflow && {
        name: 'Transparent Inflow',
        type: 'bar',
        data: filteredData.map(d => d.transparentInflow),
        itemStyle: {
          color: 'transparent',
          borderColor: '#FFFF00',
          borderWidth: 2,
          borderType: 'solid'
        }
      },
      showTransparentOutflow && {
        name: 'Transparent Outflow',
        type: 'bar',
        data: filteredData.map(d => d.transparentOutflow),
        itemStyle: {
          color: 'transparent',
          borderColor: '#666666',
          borderWidth: 2,
          borderType: 'solid'
        }
      }
    ].filter(Boolean),
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    }
  }

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