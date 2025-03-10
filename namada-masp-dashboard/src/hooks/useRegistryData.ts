import { useQuery } from '@tanstack/react-query'
import { fetchChainMetadata } from '../api/chainRegistry'

export function useRegistryData() {
  // Base registry data query - provides chain info, assets, and IBC data
  const { 
    data: registryData,
    isLoading,
    error
  } = useQuery({
    queryKey: ['registryData'],
    queryFn: () => fetchChainMetadata("namada", true)
  })

  // Example of additional registry-related query:
  /*
  const {
    data: chainParameters,
    isLoading: isLoadingParams,
    error: paramsError
  } = useQuery({
    queryKey: ['chainParameters'],
    queryFn: () => fetchChainParameters(),
    enabled: !!registryData, // Only run if registry data is available
    staleTime: 60000, // Consider data fresh for 1 minute
    gcTime: 300000,   // Keep in cache for 5 minutes
  })
  */

  return {
    registryData,
    assets: registryData?.assetList?.assets,
    chain: registryData?.chain,
    counterParties: registryData?.counterParties,
    ibcMetadata: registryData?.ibcMetadata,
    isLoading,
    error
  }
} 