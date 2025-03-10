import apiClient from './apiClient'

const indexerUrl = import.meta.env.VITE_INDEXER_URL
const indexerUrlLastTag = "https://indexer.namada.tududes.com"
const rpcUrl = import.meta.env.VITE_RPC_URL

interface Parameters {
  apr: string
  nativeTokenAddress: string
  // ... other parameters exist but we don't need them now
}

interface TokenSupply {
  address: string
  totalSupply: string
}

interface BlockHeight {
  block: string
}

interface BlockHeader {
  time: string
}

interface BlockMeta {
  header: BlockHeader
}

interface BlockchainResponse {
  result: {
    block_metas: BlockMeta[]
  }
}

interface VotingPower {
  totalVotingPower: string
}

interface EpochResponse {
  epoch: string
}

export async function fetchChainParameters(): Promise<Parameters> {
  const { data } = await apiClient.get(`${indexerUrl}/api/v1/chain/parameters`)
  return data
}

export async function fetchTokenSupply(address: string, epoch?: number): Promise<TokenSupply> {
  const epochParam = epoch !== undefined ? `&epoch=${epoch}` : ''
  const { data } = await apiClient.get(`${indexerUrlLastTag}/api/v1/chain/token-supply?address=${address}${epochParam}`)
  return data
}

export async function fetchLatestBlock(): Promise<BlockHeight> {
  const { data } = await apiClient.get(`${indexerUrl}/api/v1/chain/block/latest`)
  return data
}

export async function fetchBlockchainInfo(minHeight: number, maxHeight: number): Promise<BlockchainResponse> {
  const { data } = await apiClient.get(`${rpcUrl}/blockchain?minHeight=${minHeight}&maxHeight=${maxHeight}`)
  return data
}

export async function fetchVotingPower(): Promise<VotingPower> {
  const { data } = await apiClient.get(`${indexerUrl}/api/v1/pos/voting-power`)
  return data
}

export async function fetchLatestEpoch(): Promise<EpochResponse> {
  const { data } = await apiClient.get(`${indexerUrl}/api/v1/chain/epoch/latest`)
  return data
} 