import { useMemo } from "react";
import { ChainMetrics, useChainInfo } from "../../hooks/useChainInfo";
import InfoCardPrimary from "./InfoCardPrimary";
import InfoCardSecondary from "./InfoCardSecondary";
import {
  denomAmount,
  formatMagnitude,
  formatNumber,
  formatPercentage,
} from "../../utils/numbers";
import ErrorBoundary from "../common/ErrorBoundary";

interface InfoCard {
  topText: string;
  bottomText: string;
  size: "small" | "large";
  variant: "primary" | "secondary";
  bgColor?: "yellow" | "white";
}

function InfoGridContainer() {
  const {
    metrics: chainMetrics,
    isLoading: isLoadingChain,
    isError: isErrorChain,
  } = useChainInfo();
  console.log(chainMetrics, "CHAIN METRICS");
  const cards = useMemo(
    () => (chainMetrics ? createInfoCards(chainMetrics) : []),
    [chainMetrics]
  );

  if (isLoadingChain) {
    return (
      <div className="grid grid-cols-3 gap-4 mt-4 px-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="col-span-1 animate-pulse">
            <div className="bg-[#2A2A2A] h-[120px] rounded-lg" />
          </div>
        ))}
        {[...Array(6)].map((_, i) => (
          <div key={i + 3} className="col-span-1 animate-pulse">
            <div className="bg-[#2A2A2A] h-[80px] rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  if (isErrorChain) {
    return (
      <div className="mt-4">
        <div className="text-red-400 bg-red-900/20 rounded-lg p-4">
          Error loading dashboard metrics
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4 px-4">
        {cards.map((card, index) => (
          <div
            key={index}
            className={`${
              card.variant === "primary"
                ? "col-span-2 md:col-span-1"
                : "col-span-1"
            } ${card.size === "large" ? "md:row-span-2" : ""}`}
          >
            {card.variant === "primary" ? (
              <InfoCardPrimary
                topText={card.topText}
                bottomText={card.bottomText}
                size={card.size}
                bgColor={card.bgColor ?? "yellow"}
              />
            ) : (
              <InfoCardSecondary
                topText={card.topText}
                bottomText={card.bottomText}
              />
            )}
          </div>
        ))}
      </div>
    </ErrorBoundary>
  );
}
function createInfoCards(chainMetrics: ChainMetrics): InfoCard[] {
  return [
    {
      topText: "Total Shielded Assets",
      bottomText: (
        <div className="flex flex-col">
          <div className="text-lg font-bold">
            ${formatNumber(chainMetrics.totalShieldedAssets?.current)}
          </div>
          <div className="flex flex-row mt-2">
            <div className="text-sm text-gray-500 mr-3">
              ${formatNumber(chainMetrics.totalShieldedAssets?.changes["24h"])}{" "}
              (24h)
            </div>
            <div className="text-sm text-gray-500 mr-3">
              ${formatNumber(chainMetrics.totalShieldedAssets?.changes["7d"])}{" "}
              (7d)
            </div>
            <div className="text-sm text-gray-500 mr-3">
              ${formatNumber(chainMetrics.totalShieldedAssets?.changes["30d"])}{" "}
              (30d)
            </div>
          </div>
        </div>
      ),
      size: "large" as const,
      variant: "primary" as const,
    },
    {
      topText: "Total NAM rewards minted",
      bottomText: `${formatNumber(
        denomAmount(chainMetrics.totalRewardsMinted)
      )} NAM`,
      size: "large" as const,
      bgColor: "white" as const,
      variant: "primary" as const,
    },
    {
      topText: "NAM rewards minted per EPOCH",
      bottomText: `$${formatNumber(denomAmount(chainMetrics.rewardsPerEpoch))}`,
      size: "large" as const,
      bgColor: "white" as const,
      variant: "primary" as const,
    },
    {
      topText: "Block Time",
      bottomText: chainMetrics.blockTime
        ? `${formatNumber(chainMetrics.blockTime, 2)} sec`
        : "--",
      size: "small" as const,
      variant: "secondary" as const,
    },
    {
      topText: "Block Height",
      bottomText:
        chainMetrics.blockHeight !== null
          ? formatNumber(chainMetrics.blockHeight, 0)
          : "--",
      size: "small" as const,
      variant: "secondary" as const,
    },
    {
      topText: "Epoch",
      bottomText: `${chainMetrics.epoch}`,
      size: "small" as const,
      variant: "secondary" as const,
    },
    {
      topText: "Staking APR",
      bottomText:
        chainMetrics.stakingApr !== null
          ? `${formatPercentage(chainMetrics.stakingApr * 100)}`
          : "--",
      size: "small" as const,
      variant: "secondary" as const,
    },
    {
      topText: "Total native supply",
      bottomText:
        chainMetrics.totalSupply && chainMetrics.totalSupply !== null
          ? `${formatNumber(
              denomAmount(chainMetrics.totalSupply)
            )} NAM ${formatMagnitude(denomAmount(chainMetrics.totalSupply))}`
          : "--",
      size: "small" as const,
      variant: "secondary" as const,
    },
    {
      topText: "Total staked",
      bottomText:
        chainMetrics.percentStaked !== null
          ? `${formatNumber(chainMetrics.totalStaked)} (${formatPercentage(
              chainMetrics.percentStaked
            )})`
          : "--",
      size: "small" as const,
      variant: "secondary" as const,
    },
  ];
}

export default InfoGridContainer;
