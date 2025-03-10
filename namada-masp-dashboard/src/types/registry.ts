// export interface RegistryAsset {
//     name: string
//     symbol: string
//     address: string
//     decimals: number
//     logo_URIs?: {
//         png?: string
//         svg?: string
//     }
// }

// export interface AssetList {
//     assets: RegistryAsset[]
// }

// export interface ChainInfo {
//     chain_name: string
//     chain_id: string
//     pretty_name: string
//     logo_URIs?: {
//         png?: string
//         svg?: string
//     }
// }

// export interface IbcMetadata {
//     chain_1: {
//         chain_name: string
//         connection_id: string
//         client_id: string
//     }
//     chain_2: {
//         chain_name: string
//         connection_id: string
//         client_id: string
//     }
//     channels: Array<{
//         chain_1: {
//             port_id: string
//             channel_id: string
//         }
//         chain_2: {
//             port_id: string
//             channel_id: string
//         }
//     }>
// }

// export interface ChainMetadata {
//     chain: ChainInfo
//     assetList: AssetList
//     counterParties: Array<{ chain: ChainInfo }>
//     ibcMetadata: IbcMetadata[]
// } 