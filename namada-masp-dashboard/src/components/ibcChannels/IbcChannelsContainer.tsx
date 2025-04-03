import { useRegistryData } from "../../hooks/useRegistryData";
import { useTokenList } from "../../hooks/useTokenList";
import { ChainMetadata } from "../../types/chainRegistry";
import IbcChannelCard, { IbcChannel } from "./IbcChannelCard";
import { useMemo } from "react";
import ErrorBoundary from "../common/ErrorBoundary";
import "../../styles/shared.css";
import { Token, IbcToken } from "../../types/token";
import { useIbcTxCount } from "../../hooks/useIbcData";
import { IbcTxCountResponse } from "../../api/chain";

function IbcChannelsContainer() {
    const { registryData, isLoading: isLoadingRegistry } = useRegistryData();
    const { data: tokenList = [], isLoading: isLoadingTokenList } = useTokenList();
    const { data: ibcTxCount = [], isLoading: isLoadingIbcTxCount } = useIbcTxCount("allTime");
    const channels = useMemo(
        () => (registryData ? parseIbcConnections(registryData, tokenList, ibcTxCount) : []),
        [registryData, tokenList, ibcTxCount],
    );

    if (isLoadingRegistry || !registryData) {
        return (
            <div className="px-4 mt-8">
                <div className="rounded-[5px] bg-[#F5F5F5] dark:bg-[#191919] py-8 px-4">
                    <h2 className="section-heading">Open IBC Channels</h2>
                    <div className="animate-pulse space-y-6">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="bg-[#2A2A2A] h-[200px] rounded-lg" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container-surface mt-8 py-4 px-4">
            <h2 className="section-heading">Open IBC Channels</h2>
            <ErrorBoundary>
                {channels.length === 0 ? (
                    <div className="text-gray-400 text-center py-8">
                        No IBC channels found
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {channels.map((channel) => (
                            <IbcChannelCard key={channel.id} channel={channel} />
                        ))}
                    </div>
                )}
            </ErrorBoundary>
        </div>
    );
}

// Transform ibcMetadata into IbcChannel format
function parseIbcConnections(registryData: ChainMetadata, tokenList: Token[], ibcTxCount: IbcTxCountResponse): IbcChannel[] {
    return (
        registryData?.ibcMetadata?.map((conn, index) => {
            // Helper function to get chain details from registry data
            const getChainDetails = (chainName: string) => {
                if (registryData.chain.chain_name === chainName) {
                    return {
                        chainId: registryData.chain.chain_id,
                        prettyName: registryData.chain.pretty_name,
                        logoUri:
                            "https://raw.githubusercontent.com/anoma/namada-chain-registry/main/namada/images/namada.svg",
                    };
                }
                const counterparty = registryData.counterParties.find(
                    (cp) => cp.chain.chain_name === chainName,
                );
                return {
                    chainId: counterparty?.chain.chain_id || "unknown",
                    prettyName: counterparty?.chain.pretty_name || chainName,
                    logoUri:
                        counterparty?.chain.logo_URIs?.svg ||
                        "https://raw.githubusercontent.com/anoma/namada-chain-registry/main/namada/images/namada.svg",
                };
            };

            const chain1Details = getChainDetails(conn.chain_1.chain_name);
            const chain2Details = getChainDetails(conn.chain_2.chain_name);

            // Get channel IDs from the connection
            const channelId1 = conn.channels[0]?.chain_1.channel_id || "";
            const channelId2 = conn.channels[0]?.chain_2.channel_id || "";

            // Find associated assets by matching channel IDs in the trace
            const associatedAssets = tokenList
                .filter(token => registryData.assetList.assets.some(asset => asset.address === token.address))
                .filter((token): token is IbcToken => 'trace' in token)
                .filter(token => {
                    const traceParts = token.trace.split("/");
                    const channelId = traceParts[1]; // Get the channel ID from the trace
                    return channelId === channelId1 || channelId === channelId2;
                })
                .map(token => {
                    const registryAsset = registryData.assetList.assets.find(
                        asset => asset.address === token.address
                    );
                    return {
                        address: token.address,
                        trace: token.trace,
                        symbol: registryAsset?.symbol || ''
                    };
                });

            // Calculate total transactions for all associated assets
            const totalTxs = associatedAssets.reduce((total, asset) => {
                const txCount = ibcTxCount.find(entry => entry.token_address === asset.address);
                if (txCount) {
                    return total + txCount.shielded_in + txCount.shielded_out +
                        txCount.transparent_in + txCount.transparent_out;
                }
                return total;
            }, 0);

            return {
                id: index.toString(),
                status: "active",
                chainA: {
                    name: chain1Details.prettyName,
                    chainId: chain1Details.chainId,
                    connectionId: conn.chain_1.connection_id,
                    clientId: conn.chain_1.client_id,
                    portId: conn.channels[0]?.chain_1.port_id || "transfer",
                    channelId: channelId1,
                    logoUri: chain1Details.logoUri,
                },
                chainB: {
                    name: chain2Details.prettyName,
                    chainId: chain2Details.chainId,
                    connectionId: conn.chain_2.connection_id,
                    clientId: conn.chain_2.client_id,
                    portId: conn.channels[0]?.chain_2.port_id || "transfer",
                    channelId: channelId2,
                    logoUri: chain2Details.logoUri,
                },
                associatedAssets,
                totalTxs,
            };
        }) || []
    );
}

export default IbcChannelsContainer;
