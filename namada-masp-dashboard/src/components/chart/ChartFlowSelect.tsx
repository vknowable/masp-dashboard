import { useState } from 'react'

type FlowType = 'shieldedInflow' | 'shieldedOutflow' | 'transparentInflow' | 'transparentOutflow'

interface FlowOption {
    id: FlowType
    label: string
    defaultChecked: boolean
}

interface ChartFlowSelectProps {
    onChange?: (selectedFlows: Record<FlowType, boolean>) => void
}

function ChartFlowSelect({ onChange }: ChartFlowSelectProps) {
    const flowOptions: FlowOption[] = [
        { id: 'shieldedInflow', label: 'Shielded Inflow', defaultChecked: true },
        { id: 'shieldedOutflow', label: 'Shielded Outflow', defaultChecked: true },
        { id: 'transparentInflow', label: 'Transparent Inflow', defaultChecked: false },
        { id: 'transparentOutflow', label: 'Transparent Outflow', defaultChecked: false },
    ]

    const [selectedFlows, setSelectedFlows] = useState<Record<FlowType, boolean>>(() => 
        Object.fromEntries(flowOptions.map(option => [option.id, option.defaultChecked])) as Record<FlowType, boolean>
    )

    const handleFlowToggle = (flowType: FlowType) => {
        const newSelectedFlows = {
            ...selectedFlows,
            [flowType]: !selectedFlows[flowType]
        }
        setSelectedFlows(newSelectedFlows)
        onChange?.(newSelectedFlows)
    }

    return (
        <div className="min-h-full flex items-center gap-4 px-4">
            {flowOptions.map((option) => (
                <label
                    key={option.id}
                    className="flex items-center gap-2 cursor-pointer group"
                    onClick={() => handleFlowToggle(option.id)}
                >
                    <div 
                        className={`
                            w-4 h-4 border rounded flex items-center justify-center transition-colors
                            ${selectedFlows[option.id] 
                                ? 'bg-yellow-400 border-yellow-400' 
                                : 'border-gray-600 group-hover:border-gray-400'
                            }
                        `}
                    >
                        {selectedFlows[option.id] && (
                            <svg 
                                className="w-3 h-3 text-black" 
                                viewBox="0 0 24 24" 
                                fill="none" 
                                stroke="currentColor" 
                                strokeWidth="3"
                            >
                                <path d="M5 13l4 4L19 7" />
                            </svg>
                        )}
                    </div>
                    <span className="text-sm text-gray-300">{option.label}</span>
                </label>
            ))}
        </div>
    )
}

export default ChartFlowSelect