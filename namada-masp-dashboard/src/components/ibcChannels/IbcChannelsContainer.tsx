import { ReactNode } from 'react'
import IbcChannelCard, { IbcChannel } from './IbcChannelCard'

interface IbcChannelsContainerProps {
    channels: IbcChannel[];
    isLoading?: boolean;
    error?: Error | null;
}

function IbcChannelsContainer({ channels, isLoading = false, error = null }: IbcChannelsContainerProps) {
    if (isLoading) {
        return (
            <div className="px-4 mt-8">
                <div className="rounded-[5px] bg-[#F5F5F5] dark:bg-[#191919] py-8 px-4">
                    <h2 className="text-2xl font-medium text-white mb-6">Open IBC Channels</h2>
                    <div className="animate-pulse space-y-6">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="bg-[#2A2A2A] h-[200px] rounded-lg" />
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="px-4 mt-8">
                <div className="rounded-[5px] bg-[#F5F5F5] dark:bg-[#191919] py-8 px-4">
                    <h2 className="text-2xl font-medium text-white mb-6">Open IBC Channels</h2>
                    <div className="text-red-400 bg-red-900/20 rounded-lg p-4">
                        Error loading IBC channels: {error.message}
                    </div>
                </div>
            </div>
        )
    }

    // Split channels into left and right columns
    const leftColumnChannels = channels.filter((_, index) => index % 2 === 0);
    const rightColumnChannels = channels.filter((_, index) => index % 2 === 1);

    return (
        <div className="px-4 mt-8">
            <div className="rounded-[5px] bg-[#F5F5F5] dark:bg-[#191919] py-8 px-4">
                <h2 className="text-2xl font-medium text-white mb-6">Open IBC Channels</h2>

                {channels.length === 0 ? (
                    <div className="text-gray-400 text-center py-8">
                        No IBC channels found
                    </div>
                ) : (
                    <div className="flex gap-6">
                        {/* Left Column */}
                        <div className="flex-1 space-y-6">
                            {leftColumnChannels.map(channel => (
                                <IbcChannelCard
                                    key={channel.id}
                                    channel={channel}
                                />
                            ))}
                        </div>

                        {/* Right Column */}
                        <div className="flex-1 space-y-6">
                            {rightColumnChannels.map(channel => (
                                <IbcChannelCard
                                    key={channel.id}
                                    channel={channel}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default IbcChannelsContainer 