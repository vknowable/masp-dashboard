// import { useQuery } from '@tanstack/react-query'
// import { fetchChainMetadata } from '../api/chainRegistry'
// import { fetchMaspInfo } from '../api/tokens'
// import { useTokenList } from './useTokenList'
// import { useMaspBalances } from './useMaspBalances'
// import type { RegistryAsset } from '../types/chainRegistry'
// import type { TokenDisplayInfo, Token, TokensResponse } from '../types/token'
// import { fetchTokenSupply, fetchLatestEpoch } from '../api/chain'
// import { denomAmount } from '../utils/numbers'
// import { useRegistryData } from './useRegistryData'
// export interface MetricsData {
//   registryData: Awaited<ReturnType<typeof fetchChainMetadata>> | undefined
//   tokens: TokenDisplayInfo[]
//   assets: RegistryAsset[] | undefined
//   isLoading: boolean
//   error: Error | null
// }

// export function useMetricsData(): MetricsData {
//   // Fetch registry data
//   // const { 
//   //   data: registryData, 
//   //   isLoading: isLoadingRegistry, 
//   //   error: registryError 
//   // } = useQuery({
//   //   queryKey: ['registryData'],
//   //   queryFn: () => fetchChainMetadata("namada", true)
//   // })
//   const { assets, isLoading: isLoadingRegistry, error: registryError } = useRegistryData()

//   // // Fetch latest epoch
//   // const { 
//   //   data: epochInfo,
//   //   isLoading: isLoadingEpoch
//   // } = useQuery({
//   //   queryKey: ['latestEpoch'],
//   //   queryFn: fetchLatestEpoch,
//   //   staleTime: 60000, // Consider fresh for 1 minute
//   // })

//   // Get token list
//   const { data: tokenList = [] as Token[], isLoading: isLoadingTokens, error: tokenError } = useTokenList()

//   // Get MASP balances
//   // const { data: maspBalances, isLoading: isLoadingMaspBalances, error: maspError } = useMaspBalances()
//   // const maspBalancesArray = Array.isArray(maspBalances) ? maspBalances : []

//   // Fetch MASP info
//   // TODO: Replace with useMaspInfo hook
//   const { 
//     data: maspInfo, 
//     isLoading: isLoadingMasp,
//     error: maspError
//   } = useQuery({
//     queryKey: ['maspInfo'],
//     queryFn: fetchMaspInfo,
//     refetchInterval: 30000,
//     staleTime: 300000,
//   })

//   // // Calculate epoch offsets
//   // const currentEpoch = epochInfo?.epoch ? parseInt(epochInfo.epoch) : null
//   // const epochOffsets = currentEpoch ? {
//   //   current: currentEpoch,
//   //   '1d': currentEpoch - 4, // 24 hours = 4 epochs
//   //   '7d': currentEpoch - 28, // 7 days = 28 epochs
//   //   '30d': currentEpoch - 120 // 30 days = 120 epochs
//   // } : null

//   // Fetch all token supplies in a single query
//   // const { 
//   //   data: tokenSupplies = {},
//   //   isLoading: isLoadingSupplies 
//   // } = useQuery({
//   //   queryKey: ['tokenSupplies', tokenList, epochOffsets],
//   //   queryFn: async () => {
//   //     if (!Array.isArray(tokenList) || !epochOffsets) return {}
      
//   //     const supplies: Record<string, Record<string, string>> = {}
      
//   //     await Promise.all(tokenList.map(async (token) => {
//   //       supplies[token.address] = {}
//   //       await Promise.all(Object.entries(epochOffsets).map(async ([period, epoch]) => {
//   //         if (epoch >= 0) {
//   //           const supply = await fetchTokenSupply(token.address, epoch)
//   //           supplies[token.address][period] = supply?.totalSupply ?? "--"
//   //         }
//   //       }))
//   //     }))
      
//   //     return supplies
//   //   },
//   //   enabled: Array.isArray(tokenList) && !!epochOffsets,
//   //   staleTime: 60000,
//   // })

//   // Transform tokens data by matching with registry assets
//   const tokens = Array.isArray(tokenList) ? tokenList.reduce<TokenDisplayInfo[]>((acc, token) => {
//     // Find matching asset in registry
//     const matchingAsset = assets?.find(
//       asset => asset.address === token.address
//     )
//     if (!matchingAsset) return acc

//     // Get display exponent from denom units
//     const exponent = matchingAsset.denom_units?.find(
//       unit => unit.denom === matchingAsset.display
//     )?.exponent ?? 6

//     // const supplies = {
//     //   currentSupply: tokenSupplies[token.address]?.current ?? "0",
//     //   '1d': tokenSupplies[token.address]?.['1d'] ?? null,
//     //   '7d': tokenSupplies[token.address]?.['7d'] ?? null,
//     //   '30d': tokenSupplies[token.address]?.['30d'] ?? null
//     // }

//     // Get MASP balance for this token
//     // const maspBalance = maspBalancesArray.find(balance => balance.tokenAddress === token.address)
//     // const totalShielded = maspBalance?.minDenomAmount ?? "0"
//     // const currentSupply = supplies.currentSupply
//     // const totalTransparent = (BigInt(currentSupply) - BigInt(totalShielded)).toString()

//     // Calculate percentage changes
//     // const currentSupplyNum = parseFloat(supplies.currentSupply)
//     // const percentageChanges = {
//     //   '24h': supplies['1d'] && currentSupplyNum > 0 ? 
//     //     ((currentSupplyNum - parseFloat(supplies['1d'])) / parseFloat(supplies['1d'])) * 100 : null,
//     //   '7d': supplies['7d'] && currentSupplyNum > 0 ? 
//     //     ((currentSupplyNum - parseFloat(supplies['7d'])) / parseFloat(supplies['7d'])) * 100 : null,
//     //   '30d': supplies['30d'] && currentSupplyNum > 0 ? 
//     //     ((currentSupplyNum - parseFloat(supplies['30d'])) / parseFloat(supplies['30d'])) * 100 : null
//     // }

//     const tokenData: TokenDisplayInfo = {
//       symbol: matchingAsset.symbol ?? "",
//       address: token.address,
//       name: matchingAsset.name || matchingAsset.symbol || "",
//       logoUrl: matchingAsset.logo_URIs?.svg ?? "",
//       decimals: exponent,
//       // totalSupply: supplies,
//       // totalShielded,
//       // totalTransparent,
//       // currentShielded: totalShielded, // Using totalShielded as currentShielded for now
//       // currentTransparent: totalTransparent,
//       rewardsParam: "0", // Will be updated with real data
//       coingeckoId: matchingAsset.coingecko_id ?? null,
//     }

//     acc.push(tokenData)
//     return acc
//   }, []) : []
  
//   return {
//     // registryData,
//     tokens,
//     // assets: registryData?.assetList?.assets,
//     isLoading: isLoadingRegistry || isLoadingMasp || isLoadingTokens,
//     error: registryError || tokenError || maspError
//   }
// } 