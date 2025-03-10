interface InfoCardSecondaryProps {
    topText: string
    bottomText: string
    size: 'small' | 'large'
}

function InfoCardSecondary({ topText, bottomText, size }: InfoCardSecondaryProps) {
    const height = size === 'large' ? 'min-h-[10.5rem]' : 'min-h-[4.875rem]'
    return (
        <div className={`rounded-[5px] flex flex-col justify-between items-start p-[0.875rem] bg-[#F5F5F5] dark:bg-[#191919] ${height}`}>
            <div className="font-normal text-base leading-[1.5rem] text-black dark:text-white">{topText}</div>
            <div className="font-medium text-xl leading-[1.5rem] text-black dark:text-[#FFFF00]">{bottomText}</div>
        </div>
    )
}

export default InfoCardSecondary 