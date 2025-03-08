type ViewMode = 'shielded' | 'transparent'

interface ViewToggleProps {
    currentView: ViewMode
    onViewChange: (view: ViewMode) => void
}

function ViewToggle({ currentView, onViewChange }: ViewToggleProps) {
    return (
        <div className="h-full flex">
            <button
                className={`
                    flex-1 px-6 flex items-center justify-center text-sm font-medium transition-colors
                    ${currentView === 'shielded'
                        ? 'bg-[#1E1E1E] text-yellow-400'
                        : 'bg-[#2A2A2A] text-gray-400 hover:text-gray-300'
                    }
                `}
                onClick={() => onViewChange('shielded')}
            >
                Shielded (MASP)
            </button>
            <button
                className={`
                    flex-1 px-6 flex items-center justify-center text-sm font-medium transition-colors
                    ${currentView === 'transparent'
                        ? 'bg-[#1E1E1E] text-white'
                        : 'bg-[#2A2A2A] text-gray-400 hover:text-gray-300'
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