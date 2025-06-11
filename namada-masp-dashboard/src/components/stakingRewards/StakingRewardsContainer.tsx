import ErrorBoundary from "../common/ErrorBoundary";
import InfoCardSecondary from "../infoGrid/InfoCardSecondary";
import { useChainInfo } from "../../hooks/useChainInfo";
import { usePosParams } from "../../hooks/usePosParams";
import { formatPercentage } from "../../utils/numbers";

function StakingRewardsContainer() {
    const { metrics } = useChainInfo();
    const { data: posParams } = usePosParams();

    return (
        <div className="pb-8 pt-4 px-4 mt-8 h-full w-full">
            <div className="section-heading text-xl md:text-2xl mb-8">Staking Metrics</div>
            <ErrorBoundary>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <InfoCardSecondary
                        topText="Staking APR"
                        bottomText={metrics.stakingApr ? `${formatPercentage(metrics.stakingApr * 100)}` : "--"}
                    />
                    <InfoCardSecondary
                        topText="NAM Supply Staked"
                        bottomText={metrics.percentStaked ? `${formatPercentage(metrics.percentStaked)}` : "--"}
                    />
                    <InfoCardSecondary
                        topText="Staking Target"
                        bottomText={posParams?.owned.target_staked_ratio ? `${formatPercentage(Number(posParams.owned.target_staked_ratio) * 100)}` : "--"}
                    />
                    <InfoCardSecondary
                        topText="Supply Inflation"
                        bottomText={posParams?.owned.max_inflation_rate ? `${formatPercentage(Number(posParams.owned.max_inflation_rate) * 100)}` : "--"}
                    />
                </div>
            </ErrorBoundary>
        </div>
    );
}

export default StakingRewardsContainer;