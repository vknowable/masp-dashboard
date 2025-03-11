import { MaspInfo, RewardToken } from '../types/masp'

export async function fetchMaspInfo(): Promise<MaspInfo | null> {
  // try {
  //   const [epochQuery, maspEpochQuery, totalRewardsQuery, maspRewardTokensQuery] = await Promise.all([
  //     fetchAbciQuery('/shell/epoch'),
  //     fetchAbciQuery('/shell/masp_epoch'),
  //     fetchAbciQuery('/shell/value/#tnam1pcqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzmefah/max_total_rewards'),
  //     fetchAbciQuery('/shell/masp_reward_tokens'),
  //   ])

  //   return {
  //     epoch: decodeBorshEpoch(epochQuery),
  //     maspEpoch: decodeBorshEpoch(maspEpochQuery),
  //     totalRewards: decodeBorshAmt(totalRewardsQuery),
  //     rewardTokens: decodeBorshMaspTokens(maspRewardTokensQuery),
  //   }
  // } catch (error) {
  //   console.error('Error fetching MASP info:', error instanceof Error ? error.message : 'Unknown error')
  //   return null
  // }
  return null
}
