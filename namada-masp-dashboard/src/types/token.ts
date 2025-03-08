export interface TokenDisplayRow {
  symbol: string
  address: string
  name: string
  logoUrl?: string
  decimals: number
  totalShielded: string
  currentShielded: string
  rewardsParam: string
  usdPrice: number | null
  percentageChanges: {
    '24h': number
    '7d': number
    '30d': number
  }
}

export interface NativeToken {
  address: string
}

export interface IbcToken {
  address: string
  trace: string
}

export type TokensResponse = Array<NativeToken | IbcToken>

export interface TokenBalance {
  tokenAddress: string
  minDenomAmount: string
}

export type AccountResponse = Array<TokenBalance>

export interface MaspAggregate {
  tokenAddress: string
  timeWindow: string
  kind: string
  totalAmount: string
}

export type AggregatesResponse = Array<MaspAggregate>

export interface CgPriceResponse {
  [key: string]: { usd: number } | string | undefined
  attribution?: string
} 