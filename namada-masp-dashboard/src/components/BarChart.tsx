import ReactECharts from 'echarts-for-react'
import { TokenDisplayRow } from '../types/token'
import { useEffect, useState } from 'react'

type BarChartProps = {
  tokenData?: TokenDisplayRow[]
  isLoading: boolean
  error: Error | null
  hideNam: boolean
}

enum WINDOW {
  oneDay = "oneDay",
  sevenDays = "sevenDays",
  thirtyDays = "thirtyDays",
  allTime = "allTime"
}

function BarChart({ tokenData, isLoading, error, hideNam }: BarChartProps) {
  const [yData, setYData] = useState<string[]>([])
  const [xData, setXData] = useState<number[]>([])
  const [window, setWindow] = useState<string>("allTime")

  const toggleButton = () => {
    return (
      <div className="inline-flex rounded-md shadow-xs" role="group">
        <button
          type="button"
          onClick={() => setWindow(WINDOW.oneDay)}
          className={`px-4 py-2 text-sm font-medium ${
            window === WINDOW.oneDay ? 'bg-blue-500 text-white' : 'bg-blue-200 text-gray-900'
          } border border-gray-200 rounded-s-lg hover:bg-blue-300 hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:hover:text-white dark:hover:bg-gray-700 dark:focus:ring-blue-500 dark:focus:text-white`}
        >
          1 day
        </button>
        <button
          type="button"
          onClick={() => setWindow(WINDOW.sevenDays)}
          className={`px-4 py-2 text-sm font-medium ${
            window === WINDOW.sevenDays ? 'bg-blue-500 text-white' : 'bg-blue-200 text-gray-900'
          } border-t border-b border-gray-200 hover:bg-blue-300 hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:hover:text-white dark:hover:bg-gray-700 dark:focus:ring-blue-500 dark:focus:text-white`}
        >
          7 days
        </button>
        <button
          type="button"
          onClick={() => setWindow(WINDOW.thirtyDays)}
          className={`px-4 py-2 text-sm font-medium ${
            window === WINDOW.thirtyDays ? 'bg-blue-500 text-white' : 'bg-blue-200 text-gray-900'
          } border-t border-b border-gray-200 hover:bg-blue-300 hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:hover:text-white dark:hover:bg-gray-700 dark:focus:ring-blue-500 dark:focus:text-white`}
        >
          30 days
        </button>
        <button
          type="button"
          onClick={() => setWindow(WINDOW.allTime)}
          className={`px-4 py-2 text-sm font-medium ${
            window === WINDOW.allTime ? 'bg-blue-500 text-white' : 'bg-blue-200 text-gray-900'
          } border border-gray-200 rounded-e-lg hover:bg-blue-300 hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:hover:text-white dark:hover:bg-gray-700 dark:focus:ring-blue-500 dark:focus:text-white`}
        >
          All time
        </button>
      </div>
    )
  }

  useEffect(() => {
    if (tokenData) {
      const sortedData = tokenData.filter(item => hideNam ? item.name != 'NAM' : true).sort((a, b) => b.name.localeCompare(a.name))
      const yData = sortedData.map(token => token.name)
      const xData = sortedData.map(token => {
        const divisor = 10 ** token.exponent
        const inflows = parseInt(token.aggregates.find(item => item.timeWindow === window && item.kind === 'inflows')?.totalAmount ?? "0") / divisor
        const outflows = parseInt(token.aggregates.find(item => item.timeWindow === window && item.kind === 'outflows')?.totalAmount ?? "0") / divisor
        const netUSD = token.usdPrice ? (inflows - outflows) * token.usdPrice : 0
        return parseFloat(netUSD.toFixed(2))
      })
      setYData(yData)
      setXData(xData)
    } else {
      setYData([])
      setXData([])
    }
  }, [tokenData, window, hideNam])

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error fetching tokens</div>

  const options = {
    backgroundColor: '#2c343c',
    title: {
      text: 'MASP Inflow/Outflow (by $ TVL)',
      left: 'center',
      top: 20,
      textStyle: {
        color: '#ccc'
      }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      top: 80,
      bottom: 30
    },
    xAxis: {
      type: 'value',
      position: 'top',
      splitLine: {
        lineStyle: {
          type: 'dashed',
          color: '#666'
        }
      }
    },
    yAxis: {
      type: 'category',
      axisLine: { show: false },
      axisLabel: { show: false },
      axisTick: { show: false },
      splitLine: { show: false },
      data: yData
    },
    series: [
      {
        name: 'Net (Inflow - Outflow) USD',
        type: 'bar',
        stack: 'Total',
        label: {
          show: true,
          formatter: '{b}'
        },
        data: xData
      }
    ]
  }

  return (
    <>
      {
        xData.length > 0 && yData.length > 0 ?
          <div className='flex flex-col'>
            <div className='mb-2 self-end'>
              {toggleButton()}
            </div>
            <ReactECharts option={options} style={{ height: 400, width: 600 }} />
          </div>
          : null
      }
    </>
  )
}

export default BarChart