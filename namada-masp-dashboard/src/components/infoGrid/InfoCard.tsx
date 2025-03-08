export type InfoCardProps = {
    topText: string
    topTextColor: string
    bottomText: string
    bottomTextColor: string
    bgColor: string
    size: string
}

function InfoCard({ topText, topTextColor, bottomText, bottomTextColor, bgColor, size }: InfoCardProps) {
    const height = size === 'large' ? 'min-h-[10.5rem]' : 'min-h-[4.875rem]'
    return (
        <div className={`rounded-[5px] flex flex-col justify-between items-start p-[0.875rem] ${bgColor} ${height}`}>
            <div className={`font-normal text-base leading-[1.5rem] ${topTextColor}`}>{topText}</div>
            <div className={`font-medium text-xl leading-[1.5rem] ${bottomTextColor}`}>{bottomText}</div>
        </div>
    )
}

export default InfoCard