interface InfoCardPrimaryProps {
  topText: string;
  bottomText: string | JSX.Element;
  bgColor?: "yellow" | "white";
  size: "small" | "large";
}

function InfoCardPrimary({
  topText,
  bottomText,
  bgColor,
  size,
}: InfoCardPrimaryProps) {
  const height = size === "large" ? "min-h-[10.5rem]" : "min-h-[4.875rem]";
  const bg = bgColor === "yellow" ? "bg-[#FFFF00]" : "bg-[#F2F2F2]";

  return (
    <div
      className={`rounded-[5px] flex flex-col justify-between items-start p-4 pb-6 ${bg} ${height}`}
    >
      <div className="font-normal text-[16px] leading-[1.5rem] text-[#3A3A3A] tracking-[0.2px]">
        {topText}
      </div>
      <div className="font-medium text-[20px] leading-[1.5rem] text-black tracking-[0.2px]">
        {bottomText}
      </div>
    </div>
  );
}

export default InfoCardPrimary;
