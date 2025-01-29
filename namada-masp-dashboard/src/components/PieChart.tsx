import ReactECharts from 'echarts-for-react'
import { TokenDisplayRow } from '../types/token'
import { useState, useEffect } from 'react'

type PieChartProps = {
  tokenData?: TokenDisplayRow[]
  isLoading: boolean
  error: Error | null
  hideNam: boolean
}

type DataPoint = {
  value: number
  name: string
}

function PieChart({ tokenData, isLoading, error, hideNam }: PieChartProps) {
  const [data, setData] = useState<DataPoint[]>([])

  useEffect(() => {
    if (tokenData) {
      const chartData = tokenData.map(token => {
        const dataPoint: DataPoint = {
          value: Number(token.maspMarketCap),
          name: token.name,
        }
        return dataPoint
      }).filter(item => item.value != 0)
      setData(chartData)
    } else {
      setData([])
    }
  }, [tokenData])

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error fetching tokens</div>

  const options = {
    backgroundColor: '#2c343c',
    title: {
      text: 'MASP Breakdown (by $ TVL)',
      left: 'center',
      top: 20,
      textStyle: {
        color: '#ccc'
      }
    },
    tooltip: {
      trigger: 'item'
    },
    visualMap: {
      show: false,
      min: 0,
      max: 2500,
      inRange: {
        colorLightness: [0, 1]
      }
    },
    series: [
      {
        name: 'TVL (USD)',
        type: 'pie',
        radius: '55%',
        center: ['50%', '50%'],
        data: data.filter(item => hideNam ? item.name != 'NAM' : true).sort(function (a, b) {
          return a.value - b.value;
        }),
        roseType: 'radius',
        label: {
          color: 'rgba(255, 255, 255, 0.3)'
        },
        labelLine: {
          lineStyle: {
            color: 'rgba(255, 255, 255, 0.3)'
          },
          smooth: 0.2,
          length: 10,
          length2: 20
        },
        itemStyle: {
          color: '#f8f531',
          shadowBlur: 200,
          shadowColor: 'rgba(0, 0, 0, 0.5)',
          borderWidth: 1,
          borderColor: '#dada00'
        },
        animationType: 'scale',
        animationEasing: 'elasticOut',
        animationDelay: function () {
          return Math.random() * 200;
        }
      }
    ]
  }

  return (
    <>
      {
        data.length > 0 ?
          <ReactECharts option={options} style={{ height: 400, width: 600 }} /> : null
      }
    </>
  )
}

export default PieChart