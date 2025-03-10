import { Dispatch, SetStateAction } from 'react'
import { RegistryAsset } from '../../types/chainRegistry'

interface ChartTopBarProps {
  selectedAsset: string
  onAssetSelect: Dispatch<SetStateAction<string>>
  selectedTimeframe: '24hr' | '7d' | '30d'
  onTimeframeSelect: Dispatch<SetStateAction<'24hr' | '7d' | '30d'>>
  showShieldedInflow: boolean
  onShieldedInflowToggle: Dispatch<SetStateAction<boolean>>
  showShieldedOutflow: boolean
  onShieldedOutflowToggle: Dispatch<SetStateAction<boolean>>
  showTransparentInflow: boolean
  onTransparentInflowToggle: Dispatch<SetStateAction<boolean>>
  showTransparentOutflow: boolean
  onTransparentOutflowToggle: Dispatch<SetStateAction<boolean>>
  assets?: RegistryAsset[]
}

export default function ChartTopBar({
  selectedAsset,
  onAssetSelect,
  selectedTimeframe,
  onTimeframeSelect,
  showShieldedInflow,
  onShieldedInflowToggle,
  showShieldedOutflow,
  onShieldedOutflowToggle,
  showTransparentInflow,
  onTransparentInflowToggle,
  showTransparentOutflow,
  onTransparentOutflowToggle,
  assets = []
}: ChartTopBarProps) {
  return (
    <div className="min-w-full min-h-[36px] flex justify-between items-center mb-4">
      <div className="flex items-center gap-4">
        {/* Asset Select */}
        <select 
          value={selectedAsset}
          onChange={(e) => onAssetSelect(e.target.value)}
          className="bg-[#2A2A2A] text-white px-4 py-1 rounded-md border border-gray-700 focus:outline-none focus:border-yellow-400"
        >
          <option value="All">All</option>
          {assets.map(asset => (
            <option key={asset.symbol} value={asset.symbol}>
              {asset.symbol}
            </option>
          ))}
        </select>

        {/* Time Select */}
        <div className="flex gap-2">
          {(['24hr', '7d', '30d'] as const).map((time) => (
            <button
              key={time}
              onClick={() => onTimeframeSelect(time)}
              className={`
                px-4 py-1 rounded-md transition-colors
                ${selectedTimeframe === time 
                  ? 'bg-yellow-400 text-black' 
                  : 'bg-[#2A2A2A] text-white hover:bg-gray-700'}
              `}
            >
              {time}
            </button>
          ))}
        </div>
      </div>

      {/* Flow Toggles */}
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-white">
          <input
            type="checkbox"
            checked={showShieldedInflow}
            onChange={(e) => onShieldedInflowToggle(e.target.checked)}
            className="form-checkbox h-4 w-4 text-yellow-400 rounded border-gray-700 focus:ring-yellow-400"
          />
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-yellow-400"></span>
            Shielded Inflow
          </span>
        </label>

        <label className="flex items-center gap-2 text-white">
          <input
            type="checkbox"
            checked={showShieldedOutflow}
            onChange={(e) => onShieldedOutflowToggle(e.target.checked)}
            className="form-checkbox h-4 w-4 text-gray-600 rounded border-gray-700 focus:ring-gray-600"
          />
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-gray-600"></span>
            Shielded Outflow
          </span>
        </label>

        <label className="flex items-center gap-2 text-white">
          <input
            type="checkbox"
            checked={showTransparentInflow}
            onChange={(e) => onTransparentInflowToggle(e.target.checked)}
            className="form-checkbox h-4 w-4 text-yellow-400 rounded border-gray-700 focus:ring-yellow-400"
          />
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 border-2 border-yellow-400"></span>
            Transparent Inflow
          </span>
        </label>

        <label className="flex items-center gap-2 text-white">
          <input
            type="checkbox"
            checked={showTransparentOutflow}
            onChange={(e) => onTransparentOutflowToggle(e.target.checked)}
            className="form-checkbox h-4 w-4 text-gray-600 rounded border-gray-700 focus:ring-gray-600"
          />
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 border-2 border-gray-600"></span>
            Transparent Outflow
          </span>
        </label>
      </div>
    </div>
  )
}