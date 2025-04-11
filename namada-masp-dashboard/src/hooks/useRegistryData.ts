import { useQuery } from "@tanstack/react-query";
import { fetchChainMetadata } from "../api/chainRegistry";
import { retryPolicy, retryDelay } from "../api/apiClient";

export function useRegistryData() {
  // Base registry data query - provides chain info, assets, and IBC data
  const {
    data: registryData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["registryData"],
    queryFn: () => fetchChainMetadata("namada", true),
    retry: retryPolicy,
    retryDelay: retryDelay,
  });

  return {
    registryData,
    assets: registryData?.assetList?.assets,
    chain: registryData?.chain,
    counterParties: registryData?.counterParties,
    ibcMetadata: registryData?.ibcMetadata,
    isLoading,
    error,
  };
}
