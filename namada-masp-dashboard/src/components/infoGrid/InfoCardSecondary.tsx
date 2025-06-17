interface InfoCardSecondaryProps {
    topText: string;
    bottomText: string | JSX.Element;
}

function InfoCardSecondary({ topText, bottomText }: InfoCardSecondaryProps) {
    // Helper function to format the bottom text and extract secondary text
    const formatBottomText = (text: string | JSX.Element) => {
        if (typeof text === 'string' && text.includes("(")) {
            const [value, percentage] = text.split("(");
            return {
                main: value.trim(),
                secondary: `(${percentage}`,
                isStructured: false
            };
        }

        // Check if it's a JSX element with structured content (main + secondary)
        if (typeof text === 'object' && text !== null && 'props' in text) {
            return {
                main: text,
                secondary: null,
                isStructured: true
            };
        }

        // For simple strings or other cases
        return {
            main: text,
            secondary: null,
            isStructured: false
        };
    };

    const { main, secondary, isStructured } = formatBottomText(bottomText);

    return (
        <div className="rounded-[5px] flex flex-col p-3 md:p-4 h-[100px] md:h-[120px] bg-[#F5F5F5] dark:bg-[#191919]">
            {/* Top text */}
            <div className="font-normal text-[14px] md:text-[16px] leading-[1.2rem] md:leading-[1.5rem] text-black dark:text-white tracking-[0.2px] mb-2">
                {topText}
            </div>

            {/* Main value - always positioned consistently */}
            <div className="font-medium text-[16px] md:text-[20px] leading-[1.2rem] md:leading-[1.5rem] text-black dark:text-[#FFFF00] tracking-[0.2px] flex-1 flex items-start">
                {isStructured ? main : (
                    <div className="flex flex-col md:flex-row md:items-center md:gap-1">
                        <span>{main}</span>
                        {secondary && <span>{secondary}</span>}
                    </div>
                )}
            </div>

            {/* Reserve space for secondary text - always present but may be empty */}
            <div className="min-h-[1.2rem] md:min-h-[1.5rem]">
                {/* This div will be empty for cards without secondary text, ensuring consistent spacing */}
            </div>
        </div>
    );
}

export default InfoCardSecondary;
