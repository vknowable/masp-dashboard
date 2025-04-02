interface ChainInfo {
    name: string;
    chainId: string;
    connectionId: string;
    clientId: string;
    portId: string;
    channelId: string;
    logoUri: string;
}

export interface IbcChannel {
    id: string;
    status: "active" | "inactive";
    chainA: ChainInfo;
    chainB: ChainInfo;
    associatedAssets: Array<{
        address: string;
        trace: string;
        symbol: string;
    }>;
}

interface IbcChannelCardProps {
    channel: IbcChannel;
}

function IbcChannelCard({ channel }: IbcChannelCardProps) {
    const tableRows = [
        {
            label: "Channel ID",
            valueA: channel.chainA.channelId,
            valueB: channel.chainB.channelId,
        },
        {
            label: "Connection ID",
            valueA: channel.chainA.connectionId,
            valueB: channel.chainB.connectionId,
        },
        {
            label: "Client ID",
            valueA: channel.chainA.clientId,
            valueB: channel.chainB.clientId,
        },
        {
            label: "Port ID",
            valueA: channel.chainA.portId,
            valueB: channel.chainB.portId,
        },
    ];

    // Function to title case a string
    const toTitleCase = (str: string) => {
        return str
            .split(" ")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(" ");
    };

    return (
        <div className="bg-[#010101] rounded-[5px] p-6">
            <div className="space-y-4">
                {/* Header with chain logo and status badge */}
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <img
                            src={channel.chainB.logoUri}
                            alt={`${channel.chainB.name} logo`}
                            className="w-12 h-12"
                        />
                        <h3 className="text-lg font-normal text-white">
                            {toTitleCase(channel.chainB.name)}
                        </h3>
                    </div>
                    <div className="px-3 py-1 rounded-[5px] bg-[#00FF33]/15 text-[#00FF33] text-sm">
                        Active
                    </div>
                </div>

                {/* Table */}
                <div className="text-[14px] font-light text-[#B9B9B9]">
                    {/* Header row */}
                    <div className="grid grid-cols-3 gap-4 mb-2">
                        <div></div>
                        <div className="flex items-center gap-1">
                            {toTitleCase(channel.chainA.name)}
                            <div className="group relative">
                                <svg
                                    className="w-4 h-4 hover:text-gray-300"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 text-xs bg-gray-900 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                    Chain ID: {channel.chainA.chainId}
                                </div>
                            </div>
                        </div>
                        <div className="text-gray-400 flex items-center gap-1">
                            {toTitleCase(channel.chainB.name)}
                            <div className="group relative">
                                <svg
                                    className="w-4 h-4 hover:text-gray-300"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 text-xs bg-gray-900 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                    Chain ID: {channel.chainB.chainId}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Data rows */}
                    <div className="space-y-2">
                        {tableRows.map((row) => (
                            <div key={row.label} className="grid grid-cols-3 gap-4">
                                <div className="text-[#B9B9B9]">{row.label}</div>
                                <div className="text-white font-normal tracking-[0.2px]">
                                    {row.valueA}
                                </div>
                                <div className="text-white font-normal tracking-[0.2px]">
                                    {row.valueB}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Assets Section */}
                    {channel.associatedAssets.length > 0 && (
                        <div className="my-2 mt-8 pt-4 border-t border-white/30">
                            <h4 className="text-white font-normal tracking-[0.2px] mb-4">Whitelisted Tokens</h4>
                            <ul className="space-y-1 text-[#B9B9B9]">
                                {channel.associatedAssets.map((asset, index) => (
                                    <li key={index} className="flex flex-col">
                                        <div className="text-white font-light tracking-[0.2px] flex gap-2 items-center mt-1">
                                            <div className="text-white font-normal">{asset.symbol}:</div>
                                            <div className="text-[#B9B9B9]">{asset.trace}</div>
                                            <div className="text-[#B9B9B9]">({asset.address})</div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default IbcChannelCard;
