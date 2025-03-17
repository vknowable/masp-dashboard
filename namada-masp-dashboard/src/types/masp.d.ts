export type RewardTokensResponse = {
    rewardTokens: RewardToken[]
}

export type RewardToken = {
    name: string
    address: string
    max_reward_rate: number
    kp_gain: number
    kd_gain: number
    locked_amount_target: number
}

export type MaspInflationResponse = {
    timestamp: string
    data: MaspInflation[]
}

export type MaspInflation = {
    address: string
    last_locked: string
    last_inflation: string
}

export type MaspEpochResponse = {
    maspEpoch: number
}

export type MaspTotalRewardsResponse = {
    totalRewards: string
}
