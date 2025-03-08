// // Registry Types
// export interface TokenInfo {
//   symbol: string
//   address: string
//   name: string
//   logo_URIs?: {
//     svg?: string
//     png?: string
//   }
//   decimals: number
// }

// export interface RegistryData {
//   assetList: {
//     assets: TokenInfo[]
//   }
//   ibcMetadata: any // We'll type this properly when needed
// }

// // MASP Metrics Types
// export interface MaspMetrics {
//   [tokenAddress: string]: {
//     totalShielded: string
//     currentShielded: string
//     rewardsParam: string
//     percentageChanges: {
//       '24h': number
//       '7d': number
//       '30d': number
//     }
//   }
// }

// // Price Data Types
// export interface TokenPrices {
//   [symbol: string]: {
//     usdPrice: number
//     lastUpdated: string
//   }
// }

// // Combined Display Type
// export interface TokenDisplayRow {
//   symbol: string
//   address: string
//   name: string
//   logoUrl?: string
//   decimals: number
//   totalShielded: string
//   currentShielded: string
//   rewardsParam: string
//   usdPrice: number | null
//   percentageChanges: {
//     '24h': number
//     '7d': number
//     '30d': number
//   }
// } 