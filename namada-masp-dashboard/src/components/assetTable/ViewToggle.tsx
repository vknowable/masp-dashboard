type ViewMode = 'shielded' | 'transparent'

interface ViewToggleProps {
    currentView: ViewMode
    onViewChange: (view: ViewMode) => void
}

function ViewToggle({ currentView, onViewChange }: ViewToggleProps) {
    return (
        <div className="h-[60px] flex">
            <button
                className={`
                    flex-1 px-6 flex items-center justify-center text-[18px] font-regular tracking-[0.4px] transition-colors
                    ${currentView === 'shielded'
                        ? 'bg-[#010101] text-[#FFFF00]'
                        : 'bg-[#191919] text-[#AAAA00] hover:text-[#DDDD00]'
                    }
                `}
                onClick={() => onViewChange('shielded')}
            >
                Shielded (MASP)
            </button>
            <button
                className={`
                    flex-1 px-6 flex items-center justify-center text-[18px] font-regular tracking-[0.4px] transition-colors
                    ${currentView === 'transparent'
                        ? 'bg-[#010101] text-white'
                        : 'bg-[#191919] text-gray-400 hover:text-gray-300'
                    }
                `}
                onClick={() => onViewChange('transparent')}
            >
                Transparent
            </button>
        </div>
    )
}

export default ViewToggle 