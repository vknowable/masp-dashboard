import apiClient from './apiClient'
import { TokenDisplayRow, TokensResponse, NativeToken, IbcToken, AccountResponse, AggregatesResponse, CgPriceResponse } from '../types/token'
import { AbciQueryResponse } from '../types/abci'
import { decode_amount, decode_epoch, decode_reward_tokens } from 'masp_dashboard_wasm'
import { MaspInfo, RewardToken } from '../types/masp'
import { RegistryAsset } from '../types/chainRegistry'

const rpcUrl = import.meta.env.VITE_RPC_URL
const indexerUrl = import.meta.env.VITE_INDEXER_URL
const apiBaseIndexer = 'api/v1'
const coinGeckoUrl = import.meta.env.VITE_PRICE_URL
// const coinGeckoApiKey = import.meta.env.COINGECKO_API_KEY

const fetchMaspBalances = async (): Promise<AccountResponse> => {
  try {
    const { data }: { data: AccountResponse } = await apiClient.get(`${indexerUrl}/${apiBaseIndexer}/account/tnam1pcqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzmefah`)
    return data
  } catch (error) {
    console.error('Error fetching Masp Balances', error)
    return []
  }
}

const fetchMaspAggregates = async (): Promise<AggregatesResponse> => {
  // Temporarily disable this query until masp aggregates are implemented in namada-indexer

  // try {
  //   const { data }: { data: AggregatesResponse } = await apiClient.get(`${indexerUrl}/${apiBaseIndexer}/masp/aggregates`)
  //   return data
  // } catch (error) {
  //   console.error('Error fetching Masp Aggregates', error)
  //   return []
  // }
  return []
}

const fetchTokenList = async (): Promise<TokensResponse> => {
  try {
    const { data }: { data: TokensResponse } = await apiClient.get(`${indexerUrl}/${apiBaseIndexer}/chain/token`)
    return data
  } catch (error) {
    console.error('Error fetching Token List', error)
    return []
  }
}

const fetchAbciQuery = async (path: string): Promise<AbciQueryResponse | null> => {
  try {
    const { data }: { data: AbciQueryResponse } = await apiClient.get(`${rpcUrl}/abci_query`, {
      params: { path: `\"${path}\"` },
    })
    return data
  } catch (error) {
    console.error(`Error fetching ABCI query for path: ${path}`, error)
    return null
  }
}

const fetchCgPrice = async (assetId: string): Promise<CgPriceResponse | null> => {
  try {
    const { data }: { data: CgPriceResponse } = await apiClient.get(`${coinGeckoUrl}/api/v1/${assetId}/price`)
    return data
  } catch (error) {
    console.error(`Error fetching Coingecko Price for asset ${assetId}`, error)
    return null
  }
  // return {
  //   [assetId]: {
  //     usd: 4
  //   }
  // }
}

/// Fetch the token amounts to fill out all rows of the masp token table
export const fetchTokens = async (rewardTokens: RewardToken[], registeredAssets: RegistryAsset[]): Promise<TokenDisplayRow[]> => {
  const [tokenListResult, maspBalancesResult, maspAggregatesResult] = await Promise.allSettled([
    fetchTokenList(),
    fetchMaspBalances(),
    fetchMaspAggregates(),
  ])

  // Temporary fix: filter the bugged ibc traces out of the token list returned by the indexer
  const tokenListBugged = tokenListResult.status === 'fulfilled' ? tokenListResult.value : []
  const tokenList = tokenListBugged.filter(token => registeredAssets.find(asset => token.address === asset.address))
  const maspBalances = maspBalancesResult.status === 'fulfilled' ? maspBalancesResult.value : []
  const maspAggregates = maspAggregatesResult.status === 'fulfilled' ? maspAggregatesResult.value : []

  const fetchTokenData = async (token: NativeToken | IbcToken): Promise<TokenDisplayRow> => {
    // Old method of getting masp balances, by querying the balance of account tnam1pcqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzmefah
    // This no longer works for all tokens after the masp aggregates update to namada-indexer
    const balance = maspBalances.find(balance => balance.tokenAddress === token.address)
    const maspAmount = balance ? parseInt(balance.minDenomAmount) : 0

    // We still get the native token masp balance by querying the masp account balance, but for ibc tokens we calculate it from the net all-time inflow-outflow
    // let maspAmount = null
    // if ('trace' in token) {
    //   const inflows = maspAggregates.find(
    //     item =>
    //       item.kind === "inflows" &&
    //       item.timeWindow === "allTime" &&
    //       item.tokenAddress === token.address
    //   )?.totalAmount

    //   const outflows = maspAggregates.find(
    //     item =>
    //       item.kind === "outflows" &&
    //       item.timeWindow === "allTime" &&
    //       item.tokenAddress === token.address
    //   )?.totalAmount

    //   maspAmount = (parseInt(inflows ?? "0") - parseInt(outflows ?? "0"))
    // } else {
      // const balance = maspBalances.find(balance => balance.tokenAddress === token.address)
      // maspAmount = balance ? parseInt(balance.minDenomAmount) : 0
    // }

    const aggregates = maspAggregates.filter(item => item.tokenAddress === token.address)

    const matchingRewardToken = rewardTokens.find(rewardToken => rewardToken.address === token.address)
    const matchingRegistryAsset = registeredAssets.find(asset => asset.address === token.address)

    // Lookup price from CoinGecko
    const assetId = matchingRegistryAsset?.coingecko_id ?? ""

    const [
      depositAmtQueryResult,
      withdrawAmtQueryResult,
      totalAmtQueryResult,
      lastInflationQueryResult,
      lastLockedQueryResult,
      usdPriceResult,
    ] = await Promise.allSettled([
      fetchAbciQuery(`/shell/value/#tnam1qcqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqvtr7x4/deposit/${token.address}`),
      fetchAbciQuery(`/shell/value/#tnam1qcqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqvtr7x4/withdraw/${token.address}`),
      fetchAbciQuery(`/shell/value/#tnam1pyqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqej6juv/#${token.address}/balance/minted`),
      matchingRewardToken ? fetchAbciQuery(`/shell/value/#tnam1pyqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqej6juv/#${token.address}/parameters/last_inflation`) : Promise.resolve(null),
      matchingRewardToken ? fetchAbciQuery(`/shell/value/#tnam1pyqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqej6juv/#${token.address}/parameters/last_locked_amount`) : Promise.resolve(null),
      assetId !== "" ? fetchCgPrice(assetId) : Promise.resolve(null),
    ])

    const depositAmt = depositAmtQueryResult.status === 'fulfilled' ? decodeBorshAmt(depositAmtQueryResult.value) : 0
    const withdrawAmt = withdrawAmtQueryResult.status === 'fulfilled' ? decodeBorshAmt(withdrawAmtQueryResult.value) : 0
    const totalAmt = totalAmtQueryResult.status === 'fulfilled' ? decodeBorshAmt(totalAmtQueryResult.value) : 0

    const exponent = matchingRegistryAsset?.denom_units?.find(unit => unit.denom === matchingRegistryAsset.display)?.exponent ?? 6
    const divisor = 10 ** exponent

    const ssrEligible: boolean = matchingRewardToken?.max_reward_rate !== undefined && matchingRewardToken.max_reward_rate > 0

    // price is null if either no repsonse or assetId === "" (not listed)
    const usdPrice = usdPriceResult?.status === 'fulfilled' ? usdPriceResult.value?.[assetId]?.usd ?? null : null
    const maspMarketCap = usdPrice ? (maspAmount / divisor * usdPrice) : null

    const baseData = {
      ssrEligible,
      logo: matchingRegistryAsset?.logo_URIs.svg ?? "",
      name: matchingRegistryAsset?.symbol ?? "",
      address: token.address,
      trace: 'trace' in token ? token.trace : "Native",
      exponent,
      volume: (depositAmt - withdrawAmt) / divisor,
      totalAmount: totalAmt / divisor,
      maspAmount: maspAmount / divisor,
      usdPrice,
      maspMarketCap,
      aggregates,
    }

    if (matchingRewardToken && ssrEligible) {
      const lastInflation = lastInflationQueryResult.status === 'fulfilled' ? decodeBorshAmt(lastInflationQueryResult.value as AbciQueryResponse) : 0
      const lastLocked = lastLockedQueryResult.status === 'fulfilled' ? decodeBorshAmt(lastLockedQueryResult.value as AbciQueryResponse) : 0
      // const maxRate = matchingRewardToken.max_reward_rate

      const ssrRateLast = lastLocked != 0 ? lastInflation / lastLocked : 0
      const estRateCur = maspAmount != 0 ? lastInflation / maspAmount : matchingRewardToken.max_reward_rate
      // TODO: this value is meaningless since the terms cancel out and it simply equals the last inflation
      const estRewardsCur = (maspAmount * estRateCur) / divisor
      const usdRewards = usdPrice ? estRewardsCur * usdPrice : null

      return {
        ...baseData,
        ssrRateLast,
        estRateCur,
        ssrRewardsLast: lastInflation / divisor,
        estRewardsCur,
        usdRewards: usdRewards,
      }
    }

    return {
      ...baseData,
      ssrRateLast: null,
      estRateCur: null,
      ssrRewardsLast: null,
      estRewardsCur: null,
      usdRewards: null,
    }
  }

  const tokenDataResults = await Promise.allSettled(tokenList.map(fetchTokenData))

  return tokenDataResults
    .filter(result => result.status === 'fulfilled')
    .map(result => (result as PromiseFulfilledResult<TokenDisplayRow>).value)
}

export const fetchMaspInfo = async (): Promise<MaspInfo> => {
  const [epochQueryResults, maspEpochQueryResults, totalRewardsQueryResults, maspRewardTokensQueryResults] = await Promise.allSettled([
    fetchAbciQuery(`/shell/epoch`),
    fetchAbciQuery(`/shell/masp_epoch`),
    fetchAbciQuery(`/shell/value/#tnam1pcqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzmefah/max_total_rewards`),
    fetchAbciQuery(`/shell/masp_reward_tokens`),
  ])

  const epoch = epochQueryResults.status === 'fulfilled' ? decodeBorshEpoch(epochQueryResults.value) : 0
  const maspEpoch = maspEpochQueryResults.status === 'fulfilled' ? decodeBorshEpoch(maspEpochQueryResults.value) : 0
  const totalRewards = totalRewardsQueryResults.status === 'fulfilled' ? decodeBorshAmt(totalRewardsQueryResults.value) : 0
  const rewardTokens = maspRewardTokensQueryResults.status === 'fulfilled' ? decodeBorshMaspTokens(maspRewardTokensQueryResults.value) : []

  return {
    epoch,
    maspEpoch,
    totalRewards,
    rewardTokens,
  }
}

function decodeBorshAmt(response: AbciQueryResponse | null): number {
  const base64 = response?.result?.response?.value
  if (!base64) {
    return 0
  }

  try {
    return decode_amount(base64)
  } catch {
    console.error("error decoding abci borsh")
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
  } catch {
    console.error("error decoding abci borsh")
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
  } catch {
    console.error("error decoding abci borsh", response)
    return []
  }
}
