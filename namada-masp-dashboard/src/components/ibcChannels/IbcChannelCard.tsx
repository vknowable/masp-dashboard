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
    status: 'active' | 'inactive';
    chainA: ChainInfo;
    chainB: ChainInfo;
}

interface IbcChannelCardProps {
    channel: IbcChannel;
}

function IbcChannelCard({ channel }: IbcChannelCardProps) {
    const tableRows = [
        { label: 'Channel ID', valueA: channel.chainA.channelId, valueB: channel.chainB.channelId },
        { label: 'Connection ID', valueA: channel.chainA.connectionId, valueB: channel.chainB.connectionId },
        { label: 'Client ID', valueA: channel.chainA.clientId, valueB: channel.chainB.clientId },
        { label: 'Port ID', valueA: channel.chainA.portId, valueB: channel.chainB.portId },
    ]

    // Function to title case a string
    const toTitleCase = (str: string) => {
        return str.split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }

    return (
        <div className="bg-[#1E1E1E] rounded-lg p-6">
            <div className="space-y-4">
                {/* Header with chain logo and status badge */}
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <img 
                            src={channel.chainB.logoUri} 
                            alt={`${channel.chainB.name} logo`}
                            className="w-8 h-8"
                        />
                        <h3 className="text-lg font-medium text-white">{toTitleCase(channel.chainB.name)}</h3>
                    </div>
                    <div className="px-3 py-1 rounded-full bg-green-900/50 text-green-400 text-sm">
                        Active
                    </div>
                </div>

                {/* Table */}
                <div className="text-sm">
                    {/* Header row */}
                    <div className="grid grid-cols-3 gap-4 mb-2">
                        <div className="text-gray-400"></div>
                        <div className="text-gray-400 flex items-center gap-1">
                            {toTitleCase(channel.chainA.name)}
                            <div className="group relative">
                                <svg className="w-4 h-4 text-gray-500 hover:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 text-xs bg-gray-900 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                    Chain ID: {channel.chainA.chainId}
                                </div>
                            </div>
                        </div>
                        <div className="text-gray-400 flex items-center gap-1">
                            {toTitleCase(channel.chainB.name)}
                            <div className="group relative">
                                <svg className="w-4 h-4 text-gray-500 hover:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 text-xs bg-gray-900 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                    Chain ID: {channel.chainB.chainId}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Data rows */}
                    <div className="space-y-2">
                        {tableRows.map(row => (
                            <div key={row.label} className="grid grid-cols-3 gap-4">
                                <div className="text-gray-400">{row.label}</div>
                                <div className="text-white font-medium">{row.valueA}</div>
                                <div className="text-white font-medium">{row.valueB}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default IbcChannelCard 