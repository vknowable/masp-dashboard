interface InfoCardSecondaryProps {
    topText: string;
    bottomText: string;
}

function InfoCardSecondary({ topText, bottomText }: InfoCardSecondaryProps) {
    // Helper function to format the bottom text
    const formatBottomText = (text: string) => {
        if (text.includes("(")) {
            const [value, percentage] = text.split("(");
            return (
                <div className="flex flex-col md:flex-row md:items-center md:gap-1">
                    <span>{value.trim()}</span>
                    <span>({percentage}</span>
                </div>
            );
        }
        // For NAM cases, keep as is
        return <span>{text}</span>;
    };

    return (
        <div className="rounded-[5px] flex flex-col justify-between items-start p-3 md:p-4 h-[100px] md:h-[120px] bg-[#F5F5F5] dark:bg-[#191919]">
            <div className="font-normal text-[14px] md:text-[16px] leading-[1.2rem] md:leading-[1.5rem] text-black dark:text-white tracking-[0.2px]">
                {topText}
            </div>
            <div className="font-medium text-[16px] md:text-[20px] leading-[1.2rem] md:leading-[1.5rem] text-black dark:text-[#FFFF00] tracking-[0.2px]">
                {formatBottomText(bottomText)}
            </div>
        </div>
    );
}

export default InfoCardSecondary;
