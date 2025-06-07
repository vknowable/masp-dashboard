import { useChainInfo } from "../hooks/useChainInfo";
import { denomAmount, formatMagnitude } from "../utils/numbers";
import { useTokenPrices } from "../hooks/useTokenPrices";
import { useRegistryData } from "../hooks/useRegistryData";
import { usePgfInfo } from "../hooks/usePgfInfo";
import { useQuery } from "@tanstack/react-query";
import { fetchChainParameters } from "../api/chain";

function Header() {
    const { metrics } = useChainInfo();
    const { data: tokenPrices } = useTokenPrices();
    const { assets } = useRegistryData();
    const { data: pgfInfo } = usePgfInfo();
    const { data: parameters } = useQuery({
        queryKey: ["chainParameters"],
        queryFn: fetchChainParameters,
        staleTime: 300000, // Consider fresh for 5 minutes
    });

    const supply = metrics.totalSupply ? denomAmount(metrics.totalSupply) : null;
    const formattedSupply = supply ?
        `${Math.round(supply).toLocaleString()} NAM ${formatMagnitude(supply)}` :
        "Loading...";

    const pgfBalance = pgfInfo?.balance ? denomAmount(pgfInfo.balance) : null;
    const formattedPgfBalance = pgfBalance ?
        `${Math.round(pgfBalance).toLocaleString()} NAM ${formatMagnitude(pgfBalance)}` :
        "Loading...";

    // Find NAM token in registry and get its price
    const namToken = assets?.find(asset => asset.address === parameters?.nativeTokenAddress);
    const namPrice = namToken?.coingecko_id ?
        tokenPrices?.price?.find(p => p.id === namToken.coingecko_id)?.usd :
        null;
    const formattedPrice = namPrice ?
        `$${namPrice.toFixed(2)}` :
        "$ --";

    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-start bg-inherit gap-3 sm:gap-4 p-3 sm:p-4">
            <img
                src="/images/masp.png"
                alt="Masp logo"
                className="hidden sm:block w-[55px] h-[55px] rounded-lg flex-shrink-0"
            />
            <div className="flex flex-col min-w-0 flex-1">
                <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-6">
                    <h1 className="font-xl text-xl sm:text-[24px] leading-tight sm:leading-[2.8rem] tracking-[0.1px] text-black dark:text-[#FFFF00]">
                        {"Namada Metrics".toUpperCase()}
                    </h1>
                    <span className="text-xs sm:text-sm text-white/50 truncate">
                        {metrics.chainId || "Loading..."}
                    </span>
                </div>

                {/* Mobile metrics - stacked vertically */}
                <div className="flex flex-col gap-2 text-sm text-gray-600 dark:text-gray-300 sm:hidden mt-2">
                    <div className="flex justify-between">
                        <span className="text-white/70">Block Height:</span>
                        <span>{metrics.blockHeight?.toLocaleString() || "Loading..."}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-white/70">Epoch:</span>
                        <span>{metrics.epoch || "Loading..."}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-white/70">NAM Supply:</span>
                        <span className="truncate ml-2">{formattedSupply}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-white/70">PGF Treasury:</span>
                        <span className="truncate ml-2">{formattedPgfBalance}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-white/70">NAM Price:</span>
                        <span>{formattedPrice}</span>
                    </div>
                </div>

                {/* Desktop metrics - horizontal layout */}
                <div className="hidden sm:flex gap-4 text-sm text-gray-600 dark:text-gray-300 flex-wrap">
                    <span className="whitespace-nowrap">
                        Block Height: {metrics.blockHeight?.toLocaleString() || "Loading..."} / Epoch: {metrics.epoch || "Loading..."}
                    </span>
                    <span className="text-white/50">|</span>
                    <span className="whitespace-nowrap">NAM Supply: {formattedSupply}</span>
                    <span className="text-white/50">|</span>
                    <span className="whitespace-nowrap">PGF Treasury: {formattedPgfBalance}</span>
                    <span className="text-white/50">|</span>
                    <span className="whitespace-nowrap">NAM Price: {formattedPrice}</span>
                </div>
            </div>
            {/* <button className="bg-gray-300 text-white px-4 py-2 rounded-md" disabled={true}>
        Connect Keychain
      </button> */}
        </div>
    );
}

export default Header;
