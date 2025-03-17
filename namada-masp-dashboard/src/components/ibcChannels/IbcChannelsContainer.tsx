import { useRegistryData } from "../../hooks/useRegistryData";
import { ChainMetadata } from "../../types/chainRegistry";
import IbcChannelCard, { IbcChannel } from "./IbcChannelCard";
import { useMemo } from "react";
import ErrorBoundary from "../common/ErrorBoundary";
import "../../styles/shared.css";

function IbcChannelsContainer() {
  const { registryData, isLoading: isLoadingRegistry } = useRegistryData();
  const channels = useMemo(
    () => (registryData ? parseIbcConnections(registryData) : []),
    [registryData],
  );

  // Split channels into left and right columns, also memoized since they depend on channels
  const { leftColumnChannels, rightColumnChannels } = useMemo(
    () => ({
      leftColumnChannels: channels.filter((_, index) => index % 2 === 0),
      rightColumnChannels: channels.filter((_, index) => index % 2 === 1),
    }),
    [channels],
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
          <div className="flex flex-col md:flex-row gap-6">
            {/* Left Column */}
            <div className="w-full md:flex-1 space-y-6">
              {leftColumnChannels.map((channel) => (
                <IbcChannelCard key={channel.id} channel={channel} />
              ))}
            </div>

            {/* Right Column */}
            <div className="w-full md:flex-1 space-y-6">
              {rightColumnChannels.map((channel) => (
                <IbcChannelCard key={channel.id} channel={channel} />
              ))}
            </div>
          </div>
        )}
      </ErrorBoundary>
    </div>
  );
}

// Transform ibcMetadata into IbcChannel format
function parseIbcConnections(registryData: ChainMetadata): IbcChannel[] {
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

      return {
        id: index.toString(),
        status: "active",
        chainA: {
          name: chain1Details.prettyName,
          chainId: chain1Details.chainId,
          connectionId: conn.chain_1.connection_id,
          clientId: conn.chain_1.client_id,
          portId: conn.channels[0]?.chain_1.port_id || "transfer",
          channelId: conn.channels[0]?.chain_1.channel_id || "",
          logoUri: chain1Details.logoUri,
        },
        chainB: {
          name: chain2Details.prettyName,
          chainId: chain2Details.chainId,
          connectionId: conn.chain_2.connection_id,
          clientId: conn.chain_2.client_id,
          portId: conn.channels[0]?.chain_2.port_id || "transfer",
          channelId: conn.channels[0]?.chain_2.channel_id || "",
          logoUri: chain2Details.logoUri,
        },
      };
    }) || []
  );
}

export default IbcChannelsContainer;
