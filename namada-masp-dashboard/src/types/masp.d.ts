export type MaspInfo = {
  epoch: number
  maspEpoch: number
  totalRewards: number
  rewardTokens : RewardToken[]
}

export type RewardToken = {
  name: string
  address: string
  max_reward_rate: number
  kp_gain: number
  kd_gain: number
  locked_amount_target: number
}