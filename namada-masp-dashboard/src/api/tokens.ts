import axios from 'axios'
import { TokenDisplayRow, TokensResponse, NativeToken, IbcToken, AccountResponse } from '../types/token'
import { AbciQueryResponse } from '../types/abci'
import { decode_amount, decode_reward_tokens } from 'masp_dashboard_wasm'
import { MaspInfo, RewardToken } from '../types/masp'
import { RegistryAsset } from '../types/chainRegistry'

const rpcUrl = import.meta.env.VITE_RPC_URL
const indexerUrl = import.meta.env.VITE_INDEXER_URL
const apiBaseIndexer = 'api/v1'

const fetchMaspBalances = async (): Promise<AccountResponse> => {
  const { data }: { data: AccountResponse } = await axios.get(`${indexerUrl}/${apiBaseIndexer}/account/tnam1pcqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzmefah`)
  return data
}

const fetchTokenList = async (): Promise<TokensResponse> => {
  const { data }: { data: TokensResponse } = await axios.get(`${indexerUrl}/${apiBaseIndexer}/chain/token`)
  return data
}

const fetchAbciQuery = async (path: string): Promise<AbciQueryResponse> => {
  const { data }: { data: AbciQueryResponse } = await axios.get(`${rpcUrl}/abci_query`, {
    params: { path: `\"${path}\"` },
  })
  return data
}

/// Fetch the token amounts to fill out all rows of the masp token table
export const fetchTokens = async (rewardTokens: RewardToken[], registeredAssets: RegistryAsset[]): Promise<TokenDisplayRow[]> => {
  const [tokenList, maspBalances] = await Promise.all([
    fetchTokenList(),
    fetchMaspBalances(),
  ])

  const fetchTokenData = async (token: NativeToken | IbcToken): Promise<TokenDisplayRow> => {
    const balance = maspBalances.find(balance => balance.tokenAddress === token.address)
    const maspAmount = balance ? parseInt(balance.minDenomAmount) : 0

    const matchingRewardToken = rewardTokens.find(rewardToken => rewardToken.address === token.address)
    const matchingRegistryAsset = registeredAssets.find(asset => asset.address === token.address)

    // Placeholder; replace with API call to e.g., CoinGecko
    const usdPrice = 0.05

    const [
      depositAmtQuery,
      withdrawAmtQuery,
      totalAmtQuery,
      lastInflationQuery,
      lastLockedQuery,
    ] = await Promise.all([
      fetchAbciQuery(`/shell/value/#tnam1qcqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqvtr7x4/deposit/${token.address}`),
      fetchAbciQuery(`/shell/value/#tnam1qcqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqvtr7x4/withdraw/${token.address}`),
      fetchAbciQuery(`/shell/value/#tnam1pyqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqej6juv/#${token.address}/balance/minted`),
      matchingRewardToken ? fetchAbciQuery(`/shell/value/#tnam1pyqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqej6juv/#${token.address}/parameters/last_inflation`) : Promise.resolve(null),
      matchingRewardToken ? fetchAbciQuery(`/shell/value/#tnam1pyqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqej6juv/#${token.address}/parameters/last_locked_amount`) : Promise.resolve(null),
    ])

    const depositAmt = decodeBorshAmt(depositAmtQuery)
    const withdrawAmt = decodeBorshAmt(withdrawAmtQuery)
    const totalAmt = decodeBorshAmt(totalAmtQuery)

    const exponent = matchingRegistryAsset?.denom_units?.find(unit => unit.denom === matchingRegistryAsset.display)?.exponent ?? 6
    const divisor = 10 ** exponent

    const baseData = {
      ssrEligible: !!matchingRewardToken,
      logo: matchingRegistryAsset?.logo_URIs.svg ?? "",
      name: matchingRegistryAsset?.symbol ?? "",
      address: token.address,
      trace: 'trace' in token ? token.trace : "Native",
      exponent,
      volume: (depositAmt - withdrawAmt) / divisor,
      totalAmount: totalAmt / divisor,
      maspAmount: maspAmount / divisor,
      usdPrice,
      maspMarketCap: (maspAmount / divisor * usdPrice).toFixed(2),
    }

    if (matchingRewardToken) {
      const lastInflation = decodeBorshAmt(lastInflationQuery as AbciQueryResponse)
      const lastLocked = decodeBorshAmt(lastLockedQuery as AbciQueryResponse)
      const maxRate = matchingRewardToken.max_reward_rate

      const ssrRateLast = lastLocked != 0 ? lastInflation / lastLocked : maxRate
      const estRateCur = maspAmount != 0 ? lastInflation / maspAmount : maspAmount
      const estRewardsCur = (maspAmount * estRateCur) / divisor
      const usdRewards = estRewardsCur * usdPrice

      return {
        ...baseData,
        ssrRateLast,
        estRateCur,
        ssrRewardsLast: lastInflation / divisor,
        estRewardsCur,
        usdRewards: usdRewards.toFixed(2),
      }
    }

    return {
      ...baseData,
      ssrRateLast: "n/a",
      estRateCur: "n/a",
      ssrRewardsLast: "n/a",
      estRewardsCur: "n/a",
      usdRewards: "n/a",
    }
  }

  const tokenData = await Promise.all(tokenList.map(fetchTokenData))
  return tokenData
}

export const fetchMaspInfo = async (): Promise<MaspInfo> => {
  const [totalRewardsQuery, maspRewardTokensQuery] = await Promise.all([
    fetchAbciQuery(`/shell/value/#tnam1pcqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzmefah/max_total_rewards`),
    fetchAbciQuery(`/shell/masp_reward_tokens`),
  ])

  const totalRewards = decodeBorshAmt(totalRewardsQuery)
  const rewardTokens = decodeBorshMaspTokens(maspRewardTokensQuery)

  return {
    totalRewards,
    rewardTokens,
  }
}

function decodeBorshAmt(response: AbciQueryResponse): number {
    const base64 = response?.result?.response?.value
    if (base64 == null) return 0
    
    try {
      return decode_amount(base64)
    } catch {
      console.error("error decoding abci borsh")
      return 0
    }
}

function decodeBorshMaspTokens(response: AbciQueryResponse): RewardToken[] {
  const base64 = response?.result?.response?.value
  if (base64 == null) return []
  
  try {
    return decode_reward_tokens(base64)
  } catch {
    console.error("error decoding abci borsh", response)
    return []
  }
}