import { useState } from 'react'

type TimeOption = '24hr' | '7d' | '30d'

interface ChartTimeSelectProps {
    onChange?: (time: TimeOption) => void
    initialTime?: TimeOption
}

function ChartTimeSelect({ onChange, initialTime = '24hr' }: ChartTimeSelectProps) {
    const [selectedTime, setSelectedTime] = useState<TimeOption>(initialTime)

    const timeOptions: TimeOption[] = ['24hr', '7d', '30d']

    const handleTimeChange = (time: TimeOption) => {
        setSelectedTime(time)
        onChange?.(time)
    }

    return (
        <div className="min-h-full flex flex-col justify-start px-4">
            <div className="text-base font-light text-xs mb-1">Time period</div>
            <div className="flex bg-[#1E1E1E] rounded border border-gray-700 overflow-hidden">
                {timeOptions.map((time) => (
                    <button
                        key={time}
                        onClick={() => handleTimeChange(time)}
                        className={`
                            px-3 py-1 text-sm flex-1 transition-colors
                            ${selectedTime === time 
                                ? 'bg-gray-700 text-white' 
                                : 'text-gray-400 hover:bg-gray-800'
                            }
                        `}
                    >
                        {time}
                    </button>
                ))}
            </div>
        </div>
    )
}

export default ChartTimeSelect