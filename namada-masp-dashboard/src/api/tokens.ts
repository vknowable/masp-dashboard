import apiClient from './apiClient'
import { Token, TokenDisplayRow, TokensResponse, AccountResponse, AggregatesResponse, CgPriceResponse } from '../types/token'
import { AbciQueryResponse } from '../types/abci'
import { decode_amount, decode_epoch, decode_reward_tokens } from 'masp_dashboard_wasm'
import { MaspInfo, RewardToken } from '../types/masp'
import { RegistryAsset } from '../types/chainRegistry'

const rpcUrl = import.meta.env.VITE_RPC_URL
const indexerUrl = import.meta.env.VITE_INDEXER_URL
const apiBaseIndexer = 'api/v1'
const coinGeckoUrl = import.meta.env.VITE_PRICE_URL

interface ApiResponse<T> {
  data: T
}

async function fetchFromApi<T>(url: string, errorMessage: string): Promise<T | null> {
  try {
    const { data }: ApiResponse<T> = await apiClient.get(url)
    return data
  } catch (error) {
    console.error(errorMessage, error instanceof Error ? error.message : 'Unknown error')
    return null
  }
}

async function fetchMaspBalances(): Promise<AccountResponse> {
  const data = await fetchFromApi<AccountResponse>(
    `${indexerUrl}/${apiBaseIndexer}/account/tnam1pcqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzmefah`,
    'Error fetching Masp Balances'
  )
  return data ?? []
}

async function fetchMaspAggregates(): Promise<AggregatesResponse> {
  const data = await fetchFromApi<AggregatesResponse>(
    `${indexerUrl}/${apiBaseIndexer}/masp/aggregates`,
    'Error fetching Masp Aggregates'
  )
  return data ?? []
}

async function fetchTokenList(): Promise<TokensResponse> {
  const data = await fetchFromApi<TokensResponse>(
    `${indexerUrl}/${apiBaseIndexer}/chain/token`,
    'Error fetching Token List'
  )
  return data ?? []
}

async function fetchAbciQuery(path: string): Promise<AbciQueryResponse | null> {
  return await fetchFromApi<AbciQueryResponse>(
    `${rpcUrl}/abci_query?path="${path}"`,
    `Error fetching ABCI query for path: ${path}`
  )
}

async function fetchCgPrice(assetId: string): Promise<CgPriceResponse | null> {
  return await fetchFromApi<CgPriceResponse>(
    `${coinGeckoUrl}/api/v1/${assetId}/price`,
    `Error fetching Coingecko Price for asset ${assetId}`
  )
}

function decodeBorshAmt(response: AbciQueryResponse | null): number {
  const base64 = response?.result?.response?.value
  if (!base64) {
    return 0
  }

  try {
    return decode_amount(base64)
  } catch (error) {
    console.error("Error decoding abci borsh amount:", error instanceof Error ? error.message : 'Unknown error')
    return 0
  }
}

function decodeBorshEpoch(response: AbciQueryResponse | null): number {
  const base64 = response?.result?.response?.value
  if (!base64) {
    return 0
  }

  try {
    return decode_epoch(base64)
  } catch (error) {
    console.error("Error decoding abci borsh epoch:", error instanceof Error ? error.message : 'Unknown error')
    return 0
  }
}

function decodeBorshMaspTokens(response: AbciQueryResponse | null): RewardToken[] {
  const base64 = response?.result?.response?.value
  if (!base64) {
    return []
  }

  try {
    return decode_reward_tokens(base64)
  } catch (error) {
    console.error("Error decoding abci borsh tokens:", error instanceof Error ? error.message : 'Unknown error')
    return []
  }
}

interface TokenData {
  baseData: {
    ssrEligible: boolean
    logo: string
    name: string
    address: string
    trace: string
    exponent: number
    volume: number
    totalAmount: number
    maspAmount: number
    usdPrice: number | null
    maspMarketCap: number | null
    aggregates: AggregatesResponse
  }
  ssrData?: {
    ssrRateLast: number
    estRateCur: number
    estRewardsCur: number
    usdRewards: number | null
  }
}

// async function fetchTokenData(
//   token: Token,
//   rewardTokens: RewardToken[],
//   registeredAssets: RegistryAsset[],
//   maspBalances: AccountResponse,
//   maspAggregates: AggregatesResponse
// ): Promise<TokenDisplayRow | null> {
//   try {
//     const matchingRewardToken = rewardTokens.find(rewardToken => rewardToken.address === token.address)
//     const matchingRegistryAsset = registeredAssets.find(asset => asset.address === token.address)

//     if (!matchingRegistryAsset) {
//       return null
//     }

//     let maspAmount = 0
//     if (token.type === 'ibc') {
//       const inflows = maspAggregates.find(
//         item =>
//           item.kind === "inflows" &&
//           item.timeWindow === "allTime" &&
//           item.tokenAddress === token.address
//       )?.totalAmount
//       const outflows = maspAggregates.find(
//         item =>
//           item.kind === "outflows" &&
//           item.timeWindow === "allTime" &&
//           item.tokenAddress === token.address
//       )?.totalAmount
//       maspAmount = (parseInt(inflows ?? "0") - parseInt(outflows ?? "0"))
//     } else {
//       const balance = maspBalances.find(balance => balance.tokenAddress === token.address)
//       maspAmount = balance ? parseInt(balance.minDenomAmount) : 0
//     }

//     const exponent = matchingRegistryAsset.denom_units?.find(
//       unit => unit.denom === matchingRegistryAsset.display
//     )?.exponent ?? 6
//     const divisor = 10 ** exponent

//     const [
//       depositAmtQuery,
//       withdrawAmtQuery,
//       totalAmtQuery,
//       lastInflationQuery,
//       lastLockedQuery,
//       usdPriceResult
//     ] = await Promise.all([
//       fetchAbciQuery(`/shell/value/#tnam1qcqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqvtr7x4/deposit/${token.address}`),
//       fetchAbciQuery(`/shell/value/#tnam1qcqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqvtr7x4/withdraw/${token.address}`),
//       fetchAbciQuery(`/shell/value/#tnam1pyqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqej6juv/#${token.address}/balance/minted`),
//       matchingRewardToken ? fetchAbciQuery(`/shell/value/#tnam1pyqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqej6juv/#${token.address}/parameters/last_inflation`) : Promise.resolve(null),
//       matchingRewardToken ? fetchAbciQuery(`/shell/value/#tnam1pyqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqej6juv/#${token.address}/parameters/last_locked_amount`) : Promise.resolve(null),
//       matchingRegistryAsset.coingecko_id ? fetchCgPrice(matchingRegistryAsset.coingecko_id) : Promise.resolve(null)
//     ])

//     const depositAmt = decodeBorshAmt(depositAmtQuery)
//     const withdrawAmt = decodeBorshAmt(withdrawAmtQuery)
//     const totalAmt = decodeBorshAmt(totalAmtQuery)
//     const usdPrice = 4 // Temporary hardcoded value
//     const maspMarketCap = usdPrice ? (maspAmount / divisor * usdPrice) : null

//     const baseData = {
//       ssrEligible: matchingRewardToken?.max_reward_rate !== undefined && matchingRewardToken.max_reward_rate > 0,
//       logo: matchingRegistryAsset.logo_URIs?.svg ?? "",
//       name: matchingRegistryAsset.symbol ?? "",
//       address: token.address,
//       trace: 'trace' in token ? token.trace : "Native",
//       exponent,
//       volume: (depositAmt - withdrawAmt) / divisor,
//       totalAmount: totalAmt / divisor,
//       maspAmount: maspAmount / divisor,
//       usdPrice,
//       maspMarketCap,
//       aggregates: maspAggregates.filter(item => item.tokenAddress === token.address)
//     }

//     const tokenDisplayRow: TokenDisplayRow = {
//       symbol: matchingRegistryAsset.symbol ?? "",
//       address: token.address,
//       name: matchingRegistryAsset.symbol ?? "",
//       logoUrl: matchingRegistryAsset.logo_URIs?.svg,
//       decimals: exponent,
//       totalShielded: (maspAmount / divisor).toString(),
//       currentShielded: (maspAmount / divisor).toString(),
//       rewardsParam: "0",
//       usdPrice,
//       percentageChanges: {
//         '24h': 0,
//         '7d': 0,
//         '30d': 0
//       }
//     }

//     if (baseData.ssrEligible && matchingRewardToken) {
//       const lastInflation = decodeBorshAmt(lastInflationQuery)
//       const lastLocked = decodeBorshAmt(lastLockedQuery)
//       const estRateCur = maspAmount !== 0 ? lastInflation / maspAmount : matchingRewardToken.max_reward_rate
//       tokenDisplayRow.rewardsParam = estRateCur.toString()
//     }

//     return tokenDisplayRow
//   } catch (error) {
//     console.error('Error fetching token data:', error instanceof Error ? error.message : 'Unknown error')
//     return null
//   }
// }

// export async function fetchTokens(
//   rewardTokens: RewardToken[],
//   registeredAssets: RegistryAsset[]
// ): Promise<TokenDisplayRow[]> {
//   try {
//     const [tokenList, maspBalances, maspAggregates] = await Promise.all([
//       fetchTokenList(),
//       fetchMaspBalances(),
//       fetchMaspAggregates(),
//     ])

//     const filteredTokenList = tokenList.filter((token: Token) => 
//       registeredAssets.find(asset => token.address === asset.address)
//     )

//     const tokenDataResults = await Promise.all(
//       filteredTokenList.map(token => 
//         fetchTokenData(token, rewardTokens, registeredAssets, maspBalances, maspAggregates)
//       )
//     )

//     return tokenDataResults.filter((result): result is TokenDisplayRow => result !== null)
//   } catch (error) {
//     console.error('Error fetching tokens:', error instanceof Error ? error.message : 'Unknown error')
//     return []
//   }
// }

export async function fetchMaspInfo(): Promise<MaspInfo | null> {
  try {
    const [epochQuery, maspEpochQuery, totalRewardsQuery, maspRewardTokensQuery] = await Promise.all([
      fetchAbciQuery('/shell/epoch'),
      fetchAbciQuery('/shell/masp_epoch'),
      fetchAbciQuery('/shell/value/#tnam1pcqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzmefah/max_total_rewards'),
      fetchAbciQuery('/shell/masp_reward_tokens'),
    ])

    return {
      epoch: decodeBorshEpoch(epochQuery),
      maspEpoch: decodeBorshEpoch(maspEpochQuery),
      totalRewards: decodeBorshAmt(totalRewardsQuery),
      rewardTokens: decodeBorshMaspTokens(maspRewardTokensQuery),
    }
  } catch (error) {
    console.error('Error fetching MASP info:', error instanceof Error ? error.message : 'Unknown error')
    return null
  }
}
