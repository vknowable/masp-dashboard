// Base token interface that can be extended
interface BaseToken {
  address: string
}

// Extend base token for specific token types
interface NativeToken extends BaseToken {
  type: 'native'
}

interface IbcToken extends BaseToken {
  type: 'ibc'
  trace: string
}

// Use type for union of possible tokens
export type Token = NativeToken | IbcToken

// Use type for response arrays and unions
export type TokensResponse = Token[]

/**
 * Balance information for a token
 */
export interface Balance {
  tokenAddress: string
  minDenomAmount: string
}

/**
 * Response type for account balance queries
 */
export type AccountResponse = Balance[]

// Use interface for extensible aggregate data
export interface MaspAggregate {
  tokenAddress: string
  timeWindow: string
  kind: string
  totalAmount: string
}

export type AggregatesResponse = MaspAggregate[]

// Use type for strict object shape with literal types
export type TimeWindow = '24h' | '7d' | '30d'

// Use interface for display data that might need extension
export interface TokenDisplayRow {
  symbol: string
  address: string
  name: string
  logoUrl: string
  decimals: number
  totalSupply: {
    currentSupply: string
    '1d': string | null
    '7d': string | null
    '30d': string | null
  }
  totalShielded: string
  totalTransparent: string
  currentShielded: string
  currentTransparent: string
  rewardsParam: string
  usdPrice: number
}

// Use type for API response with dynamic keys
export type CgPriceResponse = {
  [key: string]: { usd: number } | string | undefined
  attribution?: string
} 