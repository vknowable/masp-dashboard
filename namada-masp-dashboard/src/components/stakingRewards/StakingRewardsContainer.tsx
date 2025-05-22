import ErrorBoundary from "../common/ErrorBoundary";
import InfoCardSecondary from "../infoGrid/InfoCardSecondary";
import { useChainInfo } from "../../hooks/useChainInfo";
import { formatPercentage } from "../../utils/numbers";

function StakingRewardsContainer() {
    const { metrics } = useChainInfo();

    return (
        <div className="pb-8 pt-4 px-4 mt-8 h-full w-full">
            <div className="section-heading text-xl md:text-2xl mb-8">Staking Rewards</div>
            <ErrorBoundary>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <InfoCardSecondary
                        topText="Staking APR"
                        bottomText={metrics.stakingApr ? `${formatPercentage(metrics.stakingApr * 100)}` : "--"}
                    />
                    <InfoCardSecondary
                        topText="Percent Staked"
                        bottomText={metrics.percentStaked ? `${formatPercentage(metrics.percentStaked)}` : "--"}
                    />
                    <InfoCardSecondary
                        topText="Target"
                        bottomText="--"
                    />
                    <InfoCardSecondary
                        topText="Inflation"
                        bottomText="--"
                    />
                </div>
            </ErrorBoundary>
        </div>
    );
}

export default StakingRewardsContainer;