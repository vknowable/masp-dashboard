interface CustomCheckboxProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label: string;
    borderColor?: "yellow" | "grey";
    checkColor?: "yellow" | "grey" | "white" | "black";
    fill?: "yellow" | "grey" | "transparent";
}

function CustomCheckbox({
    checked,
    onChange,
    label,
    borderColor = "grey",
    checkColor = "white",
    fill = "transparent",
}: CustomCheckboxProps) {
    const borderStyle =
        borderColor === "yellow" ? "border-[#FFFF00] hover:border-[#CC0]" : "border-[#707070] hover:border-[#909090]";
    const checkStyle =
        checkColor === "yellow"
            ? "#CCCC00"
            : checkColor === "grey"
                ? "#A0A0A0"
                : checkColor === "black"
                    ? "#000000"
                    : "#DFDFDF";
    const fillStyle =
        fill === "yellow"
            ? "bg-[#FFFF00]"
            : fill === "grey"
                ? "bg-[#707070]"
                : "bg-transparent";

    return (
        <label className="flex items-center gap-2 cursor-pointer select-none">
            <div
                className={`
                    w-[20px] h-[20px] rounded-[5px] border transition-colors ${fillStyle}
                    ${borderStyle}
                    flex items-center justify-center
                `}
                onClick={() => onChange(!checked)}
            >
                {checked && (
                    <svg
                        width="10"
                        height="8"
                        viewBox="0 0 10 8"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M1 4L3.5 6.5L9 1"
                            stroke={checkStyle}
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                )}
            </div>
            <span className="text-white/90 font-light text-[14px]">{label}</span>
        </label>
    );
}

export default CustomCheckbox;
