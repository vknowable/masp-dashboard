import { useQuery } from '@tanstack/react-query'
import { useRegistryData } from './useRegistryData'
import { fetchChainParameters, fetchTokenSupply, fetchLatestBlock, fetchBlockchainInfo, fetchVotingPower, fetchLatestEpoch } from '../api/chain'
import apiClient from '../api/apiClient'
import { AbciQueryResponse } from '../types/abci'
import { decode_amount } from 'masp_dashboard_wasm'
import { parseNumeric } from '../utils/numbers'
const rpcUrl = import.meta.env.VITE_RPC_URL

interface BlockHeight {
  block: string
}

export interface ChainMetrics {
  blockTime: number | null
  blockHeight: number | null
  posInflation: number | null
  stakingApr: number | null
  totalSupply: string
  totalStaked: string
  totalShieldedAssets: string
  totalRewardsMinted: string
  rewardsPerEpoch: string
  epoch: number | null
}

// Helper function to decode Borsh-encoded amounts
function decodeBorshAmt(response: AbciQueryResponse | null): number {
  const base64 = response?.result?.response?.value
  if (!base64) {
    return 0
  }

  try {
    return decode_amount(base64)
  } catch (error) {
    console.error("Error decoding abci borsh amount:", error instanceof Error ? error.message : 'Unknown error')
    return 0
  }
}

// Calculate average time between blocks in seconds
function calculateAverageBlockTime(blocks: { header: { time: string } }[]): number | null {
  if (blocks.length < 2) return null

  // Sort blocks by timestamp to ensure correct order
  const sortedBlocks = [...blocks].sort((a, b) => 
    new Date(a.header.time).getTime() - new Date(b.header.time).getTime()
  )

  let totalDiff = 0
  for (let i = 1; i < sortedBlocks.length; i++) {
    const curr = new Date(sortedBlocks[i].header.time).getTime()
    const prev = new Date(sortedBlocks[i-1].header.time).getTime()
    totalDiff += curr - prev
  }

  // Convert from milliseconds to seconds and return average
  return totalDiff / (1000 * (sortedBlocks.length - 1))
}

export function useChainInfo() {
  const { chain, isLoading: isLoadingRegistry } = useRegistryData()

  // Get chain parameters (includes APR and native token address)
  const {
    data: parameters,
    isLoading: isLoadingParams,
    error: paramsError
  } = useQuery({
    queryKey: ['chainParameters'],
    queryFn: fetchChainParameters,
    staleTime: 300000, // Consider fresh for 5 minutes
  })

  // Get native token supply
  const {
    data: tokenSupply,
    isLoading: isLoadingSupply
  } = useQuery({
    queryKey: ['tokenSupply', parameters?.nativeTokenAddress],
    queryFn: () => {
      if (!parameters?.nativeTokenAddress) {
        throw new Error('Native token address not available')
      }
      return fetchTokenSupply(parameters.nativeTokenAddress)
    },
    enabled: !!parameters?.nativeTokenAddress,
    staleTime: 60000, // Consider fresh for 1 minute
  })

  // Get latest block height
  const {
    data: blockInfo,
    isLoading: isLoadingBlock
  } = useQuery<BlockHeight>({
    queryKey: ['latestBlock'],
    queryFn: fetchLatestBlock,
    refetchInterval: 6000, // Refresh every 6 seconds
  })

  // Get block time calculation data - separate from block height updates
  const {
    data: blockchainInfo,
    isLoading: isLoadingBlockchain
  } = useQuery({
    queryKey: ['blockchain'],
    queryFn: async () => {
      const latest = await fetchLatestBlock()
      if (!latest?.block) {
        throw new Error('Latest block height not available')
      }
      const latestHeight = parseInt(latest.block)
      return fetchBlockchainInfo(latestHeight - 5, latestHeight)
    },
    refetchInterval: 30000, // Refresh every 30 seconds (less frequent than block height)
  })

  // Get total voting power (total staked)
  const {
    data: votingPower,
    isLoading: isLoadingVotingPower
  } = useQuery({
    queryKey: ['votingPower'],
    queryFn: fetchVotingPower,
    staleTime: 60000, // Consider fresh for 1 minute
  })

  // Get total rewards minted
  const {
    data: totalRewardsResponse,
    isLoading: isLoadingRewards
  } = useQuery<AbciQueryResponse>({
    queryKey: ['totalRewardsMinted'],
    queryFn: async () => {
      const { data } = await apiClient.get(
        `${rpcUrl}/abci_query?path="/shell/value/%23tnam1pcqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzmefah/max_total_rewards"`
      )
      return data
    },
    staleTime: 60000, // Consider fresh for 1 minute
  })

  // Get latest epoch
  const {
    data: epochInfo,
    isLoading: isLoadingEpoch
  } = useQuery({
    queryKey: ['latestEpoch'],
    queryFn: fetchLatestEpoch,
    staleTime: 60000, // Consider fresh for 1 minute
  })

  // Calculate block time from the last 5 blocks
  const blockTime = blockchainInfo?.result.block_metas 
    ? calculateAverageBlockTime(blockchainInfo.result.block_metas)
    : null

  // TODO: This value is in uNAM but UI shows it as $ value
  const totalRewardsMinted = decodeBorshAmt(totalRewardsResponse || null).toString()

  return {
    metrics: {
      blockTime,
      blockHeight: blockInfo ? parseNumeric(blockInfo.block) : null,
      posInflation: null, // We'll need another endpoint for this
      stakingApr: parameters?.apr ? parseNumeric(parameters.apr) : null,
      totalSupply: tokenSupply?.totalSupply || "",
      totalStaked: votingPower?.totalVotingPower || "",
      totalShieldedAssets: "", // We'll need another endpoint for this
      totalRewardsMinted,
      rewardsPerEpoch: "", // We'll need another endpoint for this
      epoch: epochInfo ? epochInfo.epoch : null
    },
    isLoading: isLoadingRegistry || isLoadingParams || isLoadingSupply || isLoadingBlock || isLoadingBlockchain || isLoadingRewards || isLoadingVotingPower || isLoadingEpoch,
    error: paramsError // You might want to handle other errors as well
  }
} 