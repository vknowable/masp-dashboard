import InfoCard, { InfoCardProps } from "./InfoCard"

interface InfoCard {
    topText: string
    topTextColor: string
    bottomText: string
    bottomTextColor: string
    bgColor: string
    size: 'small' | 'large'
}

interface InfoGridProps {
    cards: InfoCard[]
    isLoading?: boolean
    error?: Error | null
}

function InfoGrid({ cards, isLoading = false, error = null }: InfoGridProps) {
    if (isLoading) {
        return (
            <div className="grid grid-cols-3 gap-4 mt-4 px-4">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="col-span-1 animate-pulse">
                        <div className="bg-[#2A2A2A] h-[120px] rounded-lg" />
                    </div>
                ))}
                {[...Array(6)].map((_, i) => (
                    <div key={i + 3} className="col-span-1 animate-pulse">
                        <div className="bg-[#2A2A2A] h-[80px] rounded-lg" />
                    </div>
                ))}
            </div>
        )
    }

    if (error) {
        return (
            <div className="mt-4">
                <div className="text-red-400 bg-red-900/20 rounded-lg p-4">
                    Error loading dashboard metrics: {error.message}
                </div>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-3 gap-4 mt-4 px-4">
            {cards.map((card, index) => (
                <div key={index} className={`col-span-1 ${card.size === 'large' ? 'row-span-2' : ''}`}>
                    <div className={`${card.bgColor} rounded-lg p-4 h-full`}>
                        <div className={`${card.topTextColor} text-sm mb-2`}>{card.topText}</div>
                        <div className={`${card.bottomTextColor} text-2xl font-medium`}>{card.bottomText}</div>
                    </div>
                </div>
            ))}
        </div>
    )
}

export default InfoGrid