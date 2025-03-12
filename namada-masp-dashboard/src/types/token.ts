// Base token types
export type NativeToken = {
  address: string
  type: 'native'
}

export type IbcToken = {
  address: string
  type: 'ibc'
  trace: string
}

export type Token = NativeToken | IbcToken

// API Response types
export type TokensResponse = Token[]
export type AccountResponse = Balance[]
export type AggregatesResponse = MaspAggregate[]

// Balance information
export interface Balance {
  tokenAddress: string
  minDenomAmount: string
}

// MASP aggregate data
export interface MaspAggregate {
  tokenAddress: string
  timeWindow: string
  kind: string
  totalAmount: string
}

