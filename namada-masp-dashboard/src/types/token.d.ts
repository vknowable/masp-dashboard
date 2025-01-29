// Represents a row in the display table of masp tokens
export type TokenDisplayRow = {
  ssrEligible: boolean
  logo: string
  name: string
  address: string
  trace?: string
  exponent: number
  volume: number
  totalAmount: number
  usdPrice: number
  maspMarketCap: number|string
  maspAmount: number
  ssrRateLast: number|string
  estRateCur: number|string
  ssrRewardsLast: number|string
  estRewardsCur: number|string
  usdRewards: number|string
  aggregates: MaspAggregate[]
}

// Represents a response from the namada-indexer api/v1/chain/token endpoint
export type TokensResponse = Array<NativeToken | IbcToken>

export type NativeToken = {
  address: string
}

export type IbcToken = {
  address: string
  trace: string
}

// Represents a response from the namada-indexer api/v1/account/{address} endpoint
export type AccountResponse = Array<TokenBalance>

export type TokenBalance = {
  tokenAddress: string
  minDenomAmount: string
}

// Represents a response from the namada-indexer api/v1/masp/aggregates endpoint
export type AggregatesResponse = Array<MaspAggregate>

export type MaspAggregate = {
  tokenAddress: string
  timeWindow: string
  kind: string
  totalAmount: string
}
