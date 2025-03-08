import { useMemo } from 'react'
import { useMaspMetrics, useTokenPrices } from '../queries/tokenQueries'
import { RegistryAsset, ChainMetadata } from '../types/chainRegistry'

interface UseTokenDisplayProps {
  chainData: ChainMetadata | null | undefined
}

export function useTokenDisplay({ chainData }: UseTokenDisplayProps) {
  const isLoadingRegistry = !chainData
  const registryError = undefined // We'll let the parent component handle registry errors

  const { 
    data: maspMetrics, 
    isLoading: isLoadingMasp,
    error: maspError 
  } = useMaspMetrics()

  const { 
    data: prices, 
    isLoading: isLoadingPrices,
    error: pricesError 
  } = useTokenPrices()

  // Combine loading states
  const isLoading = isLoadingRegistry || isLoadingMasp || isLoadingPrices

  // Combine errors (return the first error encountered)
  const error = registryError || maspError || pricesError

  // Transform data into TokenDisplayRow[]
  const tokenRows = useMemo(() => {
    if (!chainData?.assetList?.assets || !maspMetrics || !prices) return []

    return chainData.assetList.assets.map((asset: RegistryAsset) => ({
      symbol: asset.symbol,
      address: asset.address,
      name: asset.name,
      logoUrl: asset.logo_URIs?.svg,
      decimals: asset.denom_units?.[0]?.exponent ?? 0,
    //   totalShielded: maspMetrics[asset.address]?.totalShielded ?? '0',
    //   currentShielded: maspMetrics[asset.address]?.currentShielded ?? '0',
    //   rewardsParam: maspMetrics[asset.address]?.rewardsParam ?? '0',
    totalShielded: "0",
    currentShielded: "0",
    rewardsParam: "0",
    //   usdPrice: prices[asset.symbol]?.usdPrice ?? null,
      usdPrice: 4,
    //   percentageChanges: maspMetrics[asset.address]?.percentageChanges ?? {
    //     '24h': 0,
    //     '7d': 0,
    //     '30d': 0
    //   }
    percentageChanges: {
        '24h': 0,
        '7d': 0,
        '30d': 0
      }
    }))
  }, [chainData, maspMetrics, prices])

  return {
    tokenRows,
    isLoading,
    error
  }
} 