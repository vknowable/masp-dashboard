import InfoCardPrimary from "./InfoCardPrimary"
import InfoCardSecondary from "./InfoCardSecondary"

interface InfoCard {
    topText: string
    bottomText: string
    size: 'small' | 'large'
    variant: 'primary' | 'secondary'
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
                    {card.variant === 'primary' ? (
                        <InfoCardPrimary
                            topText={card.topText}
                            bottomText={card.bottomText}
                            size={card.size}
                        />
                    ) : (
                        <InfoCardSecondary
                            topText={card.topText}
                            bottomText={card.bottomText}
                            size={card.size}
                        />
                    )}
                </div>
            ))}
        </div>
    )
}

export default InfoGrid