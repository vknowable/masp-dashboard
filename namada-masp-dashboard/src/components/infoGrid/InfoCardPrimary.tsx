interface InfoCardPrimaryProps {
    topText: string
    bottomText: string
    size: 'small' | 'large'
}

function InfoCardPrimary({ topText, bottomText, size }: InfoCardPrimaryProps) {
    const height = size === 'large' ? 'min-h-[10.5rem]' : 'min-h-[4.875rem]'
    return (
        <div className={`rounded-[5px] flex flex-col justify-between items-start p-[0.875rem] bg-[#FFFF00] ${height}`}>
            <div className="font-normal text-base leading-[1.5rem] text-[#3A3A3A]">{topText}</div>
            <div className="font-medium text-xl leading-[1.5rem] text-black">{bottomText}</div>
        </div>
    )
}

export default InfoCardPrimary 