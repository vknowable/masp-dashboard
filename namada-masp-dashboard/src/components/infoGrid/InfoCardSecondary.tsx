interface InfoCardSecondaryProps {
    topText: string
    bottomText: string
    size: 'small' | 'large'
}

function InfoCardSecondary({ topText, bottomText, size }: InfoCardSecondaryProps) {
    const height = size === 'large' ? 'min-h-[10.5rem]' : 'min-h-[4.875rem]'
    return (
        <div className={`rounded-[5px] flex flex-col justify-between items-start p-4 pb-6 bg-[#F5F5F5] dark:bg-[#191919] ${height}`}>
            <div className="font-normal text-[16px] leading-[1.5rem] text-black dark:text-white tracking-[0.2px]">{topText}</div>
            <div className="font-medium text-[20px] leading-[1.5rem] text-black dark:text-[#FFFF00] tracking-[0.2px]">{bottomText}</div>
        </div>
    )
}

export default InfoCardSecondary 