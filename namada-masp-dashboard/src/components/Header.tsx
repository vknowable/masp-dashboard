import { useChainInfo } from "../hooks/useChainInfo";
import { denomAmount, formatMagnitude } from "../utils/numbers";
import { useTokenPrices } from "../hooks/useTokenPrices";
import { useRegistryData } from "../hooks/useRegistryData";
import { useQuery } from "@tanstack/react-query";
import { fetchChainParameters } from "../api/chain";

function Header() {
    const { metrics } = useChainInfo();
    const { data: tokenPrices } = useTokenPrices();
    const { assets } = useRegistryData();
    const { data: parameters } = useQuery({
        queryKey: ["chainParameters"],
        queryFn: fetchChainParameters,
        staleTime: 300000, // Consider fresh for 5 minutes
    });

    const supply = metrics.totalSupply ? denomAmount(metrics.totalSupply) : null;
    const formattedSupply = supply ?
        `${supply.toLocaleString()} NAM ${formatMagnitude(supply)}` :
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
        <div className="flex items-center justify-start bg-inherit gap-4 p-4">
            <img
                src="/images/masp.png"
                alt="Masp logo"
                className="w-[55px] h-[55px] rounded-lg"
            />
            <div className="flex flex-col">
                <div className="flex items-baseline gap-6">
                    <h1 className="font-xl text-[24px] leading-[2.8rem] tracking-[0.1px] text-black dark:text-[#FFFF00]">
                        {"Namada Metrics".toUpperCase()}
                    </h1>
                    <span className="text-sm text-white/50">
                        {metrics.chainId || "Loading..."}
                    </span>
                </div>
                <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-300">
                    <span>
                        Block Height: {metrics.blockHeight?.toLocaleString() || "Loading..."} / Epoch: {metrics.epoch || "Loading..."}
                    </span>
                    <span className="text-white/50">|</span>
                    <span>NAM Supply: {formattedSupply}</span>
                    <span className="text-white/50">|</span>
                    <span>PGF Treasury: 25,000,000</span>
                    <span className="text-white/50">|</span>
                    <span>NAM Price: {formattedPrice}</span>
                </div>
            </div>
            {/* <button className="bg-gray-300 text-white px-4 py-2 rounded-md" disabled={true}>
        Connect Keychain
      </button> */}
        </div>
    );
}

export default Header;
