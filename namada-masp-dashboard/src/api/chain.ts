import apiClient from './apiClient'
import { AbciQueryResponse } from '../types/abci'
import { Token, Balance, AggregatesResponse } from '../types/token'

const indexerUrl = import.meta.env.VITE_INDEXER_URL
const rpcUrl = import.meta.env.VITE_RPC_URL
const apiUrl = import.meta.env.VITE_API_URL
export const MASP_ADDRESS = 'tnam1pcqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzmefah'

interface Parameters {
  apr: string
  nativeTokenAddress: string
  // ... other parameters exist but we don't need them now
}

export interface BlockHeight {
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

export interface TokenPrice {
  id: string,
  usd: number
}

export interface TokenPriceResponse {
  attribution: string
  price: TokenPrice
}

export interface TokenPricesResponse {
  attribution?: string
  price: TokenPrice[]
}

export interface TokenSupplies {
  timestamp: string;
  supplies: Array<{
    address: string;
    supplies: {
      current: string | null;
      '1dAgo': string | null;
      '7dAgo': string | null;
      '30dAgo': string | null;
    }
  }>
}

export interface TransformedTokenSupplies {
  timestamp: string;
  supplies: Array<TransformedTokenSupply>
}

export interface TransformedTokenSupply {
  address: string;
  supplies: {
    current: number | null;
    '1dAgo': number | null;
    '7dAgo': number | null;
    '30dAgo': number | null;
    changes: {
      '24h': number | null;
      '7d': number | null;
      '30d': number | null;
    }
  }
}

export interface MaspBalances {
  balances: Balance[]
}

export interface TransformedMaspBalances {
  balances: Array<TransformedMaspBalance>
}

export interface TransformedMaspBalance {
  tokenAddress: string
  balances: {
    current: number | null;
    changes: {
      '24h': number | null;
      '7d': number | null;
      '30d': number | null;
      'allTime': number | null;
    }
  }
}

export async function fetchChainParameters(): Promise<Parameters> {
  const { data } = await apiClient.get(`${indexerUrl}/api/v1/chain/parameters`)
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

export async function fetchTotalRewardsMinted(): Promise<AbciQueryResponse> {
  const { data } = await apiClient.get(
    `${rpcUrl}/abci_query?path="/shell/value/%23tnam1pcqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzmefah/max_total_rewards"`
  )
  return data
}

export async function fetchTokenPrices(): Promise<TokenPricesResponse> {
  const { data } = await apiClient.get(`${apiUrl}/api/v1/all/price`)
  return data
}

export async function fetchTokenSupplies(): Promise<TokenSupplies> {
  const { data } = await apiClient.get<TokenSupplies>(`${apiUrl}/api/v1/token/supplies`);
  return data;
}

export async function fetchTokenList(): Promise<Token[]> {
  const { data } = await apiClient.get(`${indexerUrl}/api/v1/chain/token`)
  return data
}

export async function fetchMaspBalances(): Promise<MaspBalances> {
  const { data } = await apiClient.get(`${indexerUrl}/api/v1/account/${MASP_ADDRESS}`)
  return { balances: data }
}

export async function fetchMaspAggregates(): Promise<AggregatesResponse> {
  const { data } = await apiClient.get(`${indexerUrl}/api/v1/masp/aggregates`)
  return data
} 