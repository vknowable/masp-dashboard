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

const chainLogoMapping: Record<string, string> = {
    neutron: "neutron.svg",
    nym: "nym.svg",
    penumbra: "um.svg",
};

const zeroSupplyTokens: IbcToken[] = [
    {
        address: "tnam1pk6pgu4cpqeu4hqjkt6s724eufu64svpqgu52m3g",
        trace: "transfer/channel-7/untrn",
        type: "ibc",
    },
    {
        address: "tnam1phv4vcuw2ftsjahhvg65w4ux8as09tlysuhvzqje",
        trace: "transfer/channel-6/unym",
        type: "ibc",
    },
    {
        address: "tnam1pkl64du8p2d240my5umxm24qhrjsvh42ruc98f97",
        trace: "transfer/channel-5/uusdc",
        type: "ibc",
    },
    {
        address: "tnam1pk288t54tg99umhamwx998nh0q2dhc7slch45sqy",
        trace: "transfer/channel-4/upenumbra",
        type: "ibc",
    },
]

function IbcChannelsContainer() {
    const { registryData, isLoading: isLoadingRegistry } = useRegistryData();
    const { data: tokenList = [], isLoading: isLoadingTokenList } = useTokenList();
    const { data: ibcTxCount = [], isLoading: isLoadingIbcTxCount } = useIbcTxCount("allTime");
    const channels = useMemo(
        () => (registryData ? parseIbcConnections(registryData, tokenList, ibcTxCount).sort((a, b) => a.chainB.name.localeCompare(b.chainB.name)) : []),
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
export function parseIbcConnections(registryData: ChainMetadata, tokenList: Token[], ibcTxCount: IbcTxCountResponse): IbcChannel[] {
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

                // A few of the chains don't have a logo in the registry, so we map them to a local image
                // Neutron's registry logo is not suitable for display on a black background, so we add a special case for it
                let logoUri = counterparty?.chain.logo_URIs?.svg;
                // Prioritize local mapping for specific chains like neutron
                if (chainName === 'neutron' && chainName in chainLogoMapping) {
                    logoUri = `/images/chain/${chainLogoMapping[chainName]}`;
                } else if (!logoUri && chainName in chainLogoMapping) {
                    logoUri = `/images/chain/${chainLogoMapping[chainName]}`;
                }
                // Fallback if still no logo found
                if (!logoUri) {
                    logoUri = "https://raw.githubusercontent.com/anoma/namada-chain-registry/main/namada/images/namada.svg";
                }

                return {
                    chainId: counterparty?.chain.chain_id || "unknown",
                    prettyName: counterparty?.chain.pretty_name || chainName,
                    logoUri: logoUri,
                };
            };

            const chain1Details = getChainDetails(conn.chain_1.chain_name);
            const chain2Details = getChainDetails(conn.chain_2.chain_name);

            // Get channel IDs from the connection
            const channelId1 = conn.channels[0]?.chain_1.channel_id || "";
            const channelId2 = conn.channels[0]?.chain_2.channel_id || "";

            // Find associated assets by matching channel IDs in the trace
            const associatedAssets = [...tokenList, ...zeroSupplyTokens]
                .filter(token => registryData.assetList.assets.some(asset => asset.address === token.address))
                .filter((token): token is IbcToken => 'trace' in token)
                .filter(token => {
                    const traceParts = token.trace.split("/");
                    const channelId = traceParts[1]; // Get the channel ID from the trace
                    return channelId === channelId1;
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
