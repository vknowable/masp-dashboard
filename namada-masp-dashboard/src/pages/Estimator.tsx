import React, { useState, useEffect } from 'react';
import { useRegistryData } from "../hooks/useRegistryData";
import { useTokenPrices } from "../hooks/useTokenPrices";
import { useMaspBalances } from "../hooks/useMaspBalances";
import { useLastInflation, useMaspEpoch } from "../hooks/useMaspData";
import { denomAmount, formatNumber } from "../utils/numbers";
import { MaspInflation } from "../types/masp";
import { useChainInfo } from '../hooks/useChainInfo';

interface EstimatorProps {
    darkMode: boolean;
    setDarkMode: (value: boolean) => void;
}

interface EstimateInput {
    [key: string]: number;
}

// Custom input component
const NumericInput: React.FC<{
    value: string | number;
    onChange: (value: string) => void;
    disabled?: boolean;
    placeholder?: string;
}> = ({ value, onChange, disabled, placeholder }) => {
    // Handle numeric input with optional decimal point
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        // Allow empty string, numbers, and decimal points
        if (val === '' || /^\d*\.?\d*$/.test(val)) {
            onChange(val);
        }
    };

    return (
        <div className="relative">
            <style>
                {`
                    .custom-number-input::-webkit-inner-spin-button,
                    .custom-number-input::-webkit-outer-spin-button {
                        -webkit-appearance: none;
                        margin: 0;
                    }
                    .custom-number-input {
                        -moz-appearance: textfield;
                    }
                    .custom-number-input:focus {
                        outline: none;
                        border-color: #DDDDDD;
                        box-shadow: 0 0 0 1px #DDDDDD;
                    }
                `}
            </style>
            <input
                type="text"
                inputMode="decimal"
                className={`
                    custom-number-input
                    w-48 px-3 py-2 rounded
                    bg-gray-100 dark:bg-gray-800
                    border border-gray-300 dark:border-gray-600
                    focus:ring-1 focus:ring-[#FFFF00]
                    transition-colors duration-200
                    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                    ${value ? 'border-[#FFFF00] dark:border-[#FFFF00]' : ''}
                `}
                placeholder={placeholder}
                disabled={disabled}
                value={value}
                onChange={handleChange}
            />
        </div>
    );
};

// Minimum amount for last_locked to avoid division by very small numbers
const MIN_LOCKED_AMOUNT = 0.000001;

const Estimator = ({ darkMode, setDarkMode }: EstimatorProps) => {
    const { assets, isLoading: isLoadingRegistry } = useRegistryData();
    const { data: tokenPrices, isLoading: isLoadingPrices } = useTokenPrices();
    const { data: maspBalances, isLoading: isLoadingMaspBalances } = useMaspBalances();
    const { data: maspEpoch, isLoading: isLoadingMaspEpoch } = useMaspEpoch();
    const { metrics: chainInfo, isLoading: isLoadingChainInfo } = useChainInfo();
    const { data: lastInflation, isLoading: isLoadingLastInflation } = useLastInflation();

    const [estimateInputs, setEstimateInputs] = useState<EstimateInput>({});
    const [totalRewardsUSD, setTotalRewardsUSD] = useState(0);
    const [totalRewardsNAM, setTotalRewardsNAM] = useState(0);

    // Calculate estimated rewards for a token
    const calculateEstimatedRewards = (amount: number, tokenAddress: string): number => {
        if (!lastInflation?.data || !amount) return 0;

        // Find matching token in lastInflation
        const inflationData = lastInflation.data.find(
            (infl: MaspInflation) => infl.address === tokenAddress
        );

        if (!inflationData || !inflationData.last_locked || inflationData.last_locked === "0") {
            return 0;
        }

        const lockedAmount = Number(inflationData.last_locked);

        // Handle edge case: very small locked amount
        if (lockedAmount < MIN_LOCKED_AMOUNT) {
            return 0;
        }

        // Calculate inflation per token
        const inflationPerToken = Number(inflationData.last_inflation) / lockedAmount;

        // Calculate rewards for entered amount
        return inflationPerToken * amount;
    };

    // Update total rewards whenever inputs change
    useEffect(() => {
        if (!assets || !tokenPrices?.price || !lastInflation?.data) return;

        // Find NAM price - handle case where NAM price is not available
        const namToken = assets.find(a => a.symbol === 'NAM');
        const namPrice = namToken
            ? tokenPrices.price.find(p => p.id === namToken.coingecko_id)?.usd || 0
            : 0;

        if (namPrice === 0) {
            console.warn('NAM price not available');
        }

        let totalNAM = 0;

        Object.entries(estimateInputs).forEach(([address, amount]) => {
            const estimatedRewards = calculateEstimatedRewards(amount, address);
            totalNAM += estimatedRewards;
        });

        setTotalRewardsNAM(totalNAM);
        setTotalRewardsUSD(totalNAM * namPrice);
    }, [estimateInputs, assets, tokenPrices, lastInflation]);

    const handleInputChange = (address: string, value: string) => {
        const numValue = value === '' ? 0 : parseFloat(value);
        setEstimateInputs(prev => ({
            ...prev,
            [address]: numValue
        }));
    };

    // Check if token is eligible for rewards
    const isTokenEligible = (tokenAddress: string): boolean => {
        if (!lastInflation?.data) return false;

        const inflationData = lastInflation.data.find(
            (infl: MaspInflation) => infl.address === tokenAddress
        );

        return inflationData?.last_inflation !== "0" &&
            inflationData?.last_locked !== "0" &&
            inflationData?.last_locked !== null;
    };

    if (isLoadingRegistry || isLoadingPrices || isLoadingMaspBalances || isLoadingLastInflation) {
        return <div className="flex justify-center items-center h-full">Loading...</div>;
    }

    // Find NAM price once for all calculations
    const namToken = assets?.find(a => a.symbol === 'NAM');
    const namPrice = namToken
        ? tokenPrices?.price.find(p => p.id === namToken.coingecko_id)?.usd || 0
        : 0;

    return (
        <div className="min-h-screen flex flex-col p-[24px] bg-white dark:bg-[#121212] text-black dark:text-white">
            <main className="flex-1 pb-16">
                <div className="container-surface pb-8 pt-4 px-4 mt-8">
                    <h1 className="font-xl text-[32px] leading-[2.8rem] tracking-[0.1px] text-black dark:text-[#FFFF00] mb-6">{"Shielded Rewards Estimator".toUpperCase()}</h1>
                    <p className="text-gray-400 text-lg">Rewards are minted daily upon MASP epoch advancement, proportional to total locked assets.</p>
                    <p className="text-gray-400 mb-6 text-lg">
                        Enter amounts below to estimate future rewards, based on rewards minted during the most recent MASP epoch.
                        {namPrice === 0 && (
                            <p className="text-gray-200 text-sm mt-4">(Note: NAM price data not yet available)</p>
                        )}
                    </p>

                    <div className="flex gap-8 mb-8 text-sm">
                        <div className="flex items-center gap-2">
                            <span className="text-gray-400">Current Epoch:</span>
                            <span className="text-white">{chainInfo?.epoch || '--'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-gray-400">MASP Epoch:</span>
                            <span className="text-white">{maspEpoch?.maspEpoch || '--'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-gray-400">Latest Block:</span>
                            <span className="text-white">{chainInfo?.blockHeight || '--'}</span>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead>
                                <tr className="text-left border-b-2 border-[#666]">
                                    <th className="py-4 px-6">Asset</th>
                                    <th className="py-4 px-6">Current MASP Value Locked</th>
                                    <th className="py-4 px-6">Your Amount</th>
                                    <th className="py-4 px-6">Estimated Rewards (per 24h)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {assets?.map((token) => {
                                    const maspBalance = maspBalances?.balances.find(
                                        b => b.tokenAddress === token.address
                                    );
                                    const tokenPrice = tokenPrices?.price.find(
                                        p => p.id === token.coingecko_id
                                    )?.usd || 0;

                                    const isEligible = isTokenEligible(token.address);

                                    const rawCurrentMasp = maspBalance?.balances.current || "0";
                                    const denomCurrentMasp = denomAmount(rawCurrentMasp, 6) || 0;
                                    const currentValueUSD = denomCurrentMasp * tokenPrice;

                                    const estimatedRewards = calculateEstimatedRewards(
                                        estimateInputs[token.address] || 0,
                                        token.address
                                    );

                                    return (
                                        <tr key={token.address} className="border-b dark:border-gray-700">
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-[40px] h-[40px] rounded-full overflow-hidden bg-[#010101]">
                                                        {token.logo_URIs?.svg && (
                                                            <img
                                                                src={token.logo_URIs.svg}
                                                                alt={`${token.symbol} logo`}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        )}
                                                    </div>
                                                    <span>{token.symbol}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex flex-col">
                                                    <span>{formatNumber(denomCurrentMasp, 2)} {token.symbol}</span>
                                                    <span className="text-sm text-gray-500">
                                                        ${formatNumber(currentValueUSD, 2)}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <NumericInput
                                                    value={estimateInputs[token.address] || ''}
                                                    onChange={(value) => handleInputChange(token.address, value)}
                                                    disabled={!isEligible}
                                                    placeholder="Enter amount"
                                                />
                                            </td>
                                            <td className="py-4 px-6">
                                                {isEligible ? (
                                                    <div className="flex flex-col">
                                                        <span className={estimateInputs[token.address] ? 'text-[#FFFF00]' : 'text-gray-400'}>
                                                            {formatNumber(estimatedRewards, 6)} NAM
                                                        </span>
                                                        <span className="text-sm text-gray-500">
                                                            ${formatNumber(estimatedRewards * namPrice, 2)}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-500">Not eligible for rewards</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot>
                                <tr className="border-t-2 dark:border-gray-600 font-semibold">
                                    <td className="py-4 px-6 text-[#FFFF00] text-xl" colSpan={3}>
                                        Total Estimated Rewards
                                    </td>
                                    <td className="py-4 px-6">
                                        <div className="flex flex-col">
                                            <span className="text-[#FFFF00] text-xl">{formatNumber(totalRewardsNAM, 2)} NAM</span>
                                            <span className="text-md text-gray-500">
                                                ${formatNumber(totalRewardsUSD, 2)}
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Estimator;