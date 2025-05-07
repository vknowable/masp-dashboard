import axios from "axios";
import { config } from "../config.js";
import { wasmService } from "./wasmService.js";

export const pgfAddress = "tnam1pgqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqkhgajr"
export const MASP_ADDRESS = "tnam1pcqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzmefah";

class NamadaService {
    constructor() {
        this.tokenSupplies = [];
        this.rewardTokens = null;
        this.totalRewards = null;
        this.maspEpoch = null;
        this.maspInflation = [];
        this.startUpdates();
        // Initialize WASM module
        wasmService.init().catch(console.error);
    }

    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async backoff(attempt) {
        const baseDelay = config.initialRetryDelay * Math.pow(2, attempt - 1);
        const jitter = Math.random() * 1000;
        await this.delay(baseDelay + jitter);
    }

    async queryWithRetry(queryFn) {
        let lastError;

        for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
            try {
                return await queryFn();
            } catch (error) {
                lastError = error;

                if (error.response?.status === 429) {
                    console.log(`Rate limited on attempt ${attempt}, backing off...`);
                    await this.backoff(attempt);
                } else {
                    await this.delay(2000);
                }
            }
        }

        console.error(`Query failed after ${config.maxRetries} attempts:`, lastError.message);
        return null;
    }

    async fetchLatestBlock() {
        return this.queryWithRetry(async () => {
            const response = await axios.get(`${config.namadaRpcUrl}/status`);
            return response.data.result.sync_info.latest_block_height;
        });
    }

    calculateHistoricalHeights(currentHeight) {
        const blocksPerSecond = 7;
        const secondsPerDay = 86400;

        return {
            current: Math.floor(currentHeight),
            oneDayAgo: Math.floor(currentHeight - (secondsPerDay / blocksPerSecond)),
            sevenDaysAgo: Math.floor(currentHeight - (secondsPerDay * 7 / blocksPerSecond)),
            thirtyDaysAgo: Math.floor(currentHeight - (secondsPerDay * 30 / blocksPerSecond))
        };
    }

    async fetchTokenSupply(tokenAddress, height) {
        return this.queryWithRetry(async () => {
            try {
                const path = `"/shell/value/#tnam1pyqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqej6juv/#${tokenAddress}/balance/minted"`;
                const params = {
                    path,
                    height: height.toString()
                };
                const queryString = new URLSearchParams(params).toString();
                // console.log('Token Supply Query URL:', `${config.namadaRpcUrl}/abci_query?${queryString}`);
                const response = await axios.get(`${config.namadaRpcUrl}/abci_query`, {
                    params
                });

                if (!response.data?.result?.response?.value) {
                    console.log(`No supply data for token ${tokenAddress} at height ${height}`);
                    return null;
                }

                // Decode the ABCI value using WASM
                const decodedSupply = wasmService.decodeAbciAmount(response.data.result.response.value);

                // For NAM, we need to subtract the PGF balance from the total supply to get the effective supply
                if (tokenAddress === config.namTokenAddress) {
                    const balancePath = `"/shell/value/#tnam1pyqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqej6juv/#${config.namTokenAddress}/balance/#${pgfAddress}"`;
                    const balanceResponse = await axios.get(`${config.namadaRpcUrl}/abci_query`, {
                        params: {
                            path: balancePath,
                            height: height.toString()
                        }
                    });

                    if (!balanceResponse.data?.result?.response?.value) {
                        console.log(`No PGF balance data at height ${height}`);
                        return null;
                    }

                    // Decode the ABCI value using WASM
                    const decodedBalance = wasmService.decodeAbciAmount(balanceResponse.data.result.response.value);
                    return decodedSupply - decodedBalance;
                }

                return decodedSupply;
            } catch (error) {
                console.log(`Token supply query failed for ${tokenAddress} at height ${height}: ${error.message}`);
                return null;
            }
        });
    }

    async fetchAllTokenSupplies() {
        try {
            console.log("Fetching all token supplies");

            // Get latest block height
            const currentHeight = await this.fetchLatestBlock();
            if (!currentHeight) {
                throw new Error("Failed to fetch latest block height");
            }

            // Calculate historical heights
            const heights = this.calculateHistoricalHeights(currentHeight);

            // Get list of registered assets
            const assetList = await this.fetchAssetList();
            if (!assetList || assetList.length === 0) {
                throw new Error("Failed to fetch asset list");
            }

            // Fetch supplies for each token at each height
            const tokenSupplies = [];
            for (const asset of assetList) {
                // Handle each timeframe independently
                const [current, oneDayAgo, sevenDaysAgo, thirtyDaysAgo] = await Promise.all([
                    this.fetchTokenSupply(asset.address, heights.current).catch(() => null),
                    this.fetchTokenSupply(asset.address, heights.oneDayAgo).catch(() => null),
                    this.fetchTokenSupply(asset.address, heights.sevenDaysAgo).catch(() => null),
                    this.fetchTokenSupply(asset.address, heights.thirtyDaysAgo).catch(() => null)
                ]);

                tokenSupplies.push({
                    address: asset.address,
                    supplies: {
                        current,
                        '1dAgo': oneDayAgo,
                        '7dAgo': sevenDaysAgo,
                        '30dAgo': thirtyDaysAgo
                    }
                });

                // Add delay between assets
                await this.delay(1000);
            }

            this.tokenSupplies = tokenSupplies;
            return tokenSupplies;
        } catch (error) {
            console.error("Error fetching token supplies:", error);
            return []; // Return empty array instead of throwing
        }
    }

    async fetchAssetList() {
        try {
            const response = await axios.get(config.assetListUrl);
            return response.data.assets || [];
        } catch (error) {
            console.error("Error fetching asset list:", error.message);
            return [];
        }
    }

    async fetchRewardTokens() {
        console.log("Fetching reward tokens");
        return this.queryWithRetry(async () => {
            try {
                const response = await axios.get(`${config.namadaRpcUrl}/abci_query`, {
                    params: {
                        path: '"/shell/masp_reward_tokens"'
                    }
                });

                if (!response.data?.result?.response?.value) {
                    console.log('No reward tokens data available');
                    return null;
                }

                // Decode the ABCI value using WASM
                const decodedTokens = wasmService.decodeAbciRewardTokens(response.data.result.response.value);
                this.rewardTokens = decodedTokens
                return decodedTokens;
            } catch (error) {
                console.log(`Reward tokens query failed: ${error.message}`);
                return null;
            }
        });
    }

    async fetchTotalRewards() {
        console.log("Fetching total rewards");
        return this.queryWithRetry(async () => {
            try {
                const response = await axios.get(`${config.namadaRpcUrl}/abci_query`, {
                    params: {
                        path: `"/shell/value/#${MASP_ADDRESS}/max_total_rewards"`
                    }
                });

                if (!response.data?.result?.response?.value) {
                    console.log('No total rewards data available');
                    return null;
                }

                // Decode the ABCI value using WASM
                const decodedRewards = wasmService.decodeAbciAmount(response.data.result.response.value);
                this.totalRewards = decodedRewards;
                return decodedRewards;
            } catch (error) {
                console.log(`Total rewards query failed: ${error.message}`);
                return null;
            }
        });
    }

    async fetchMaspEpoch() {
        console.log("Fetching MASP epoch");
        return this.queryWithRetry(async () => {
            try {
                const response = await axios.get(`${config.namadaRpcUrl}/abci_query`, {
                    params: {
                        path: '"/shell/masp_epoch"'
                    }
                });

                if (!response.data?.result?.response?.value) {
                    console.log('No MASP epoch data available');
                    return null;
                }

                // Decode the ABCI value using WASM
                const decodedEpoch = wasmService.decodeAbciMaspEpoch(response.data.result.response.value);
                this.maspEpoch = decodedEpoch;
                return decodedEpoch;
            } catch (error) {
                console.log(`MASP epoch query failed: ${error.message}`);
                return null;
            }
        });
    }

    async fetchMaspInflation() {
        console.log("Fetching MASP inflation data");
        try {
            // Get list of registered assets
            const assetList = await this.fetchAssetList();
            if (!assetList || assetList.length === 0) {
                throw new Error("Failed to fetch asset list");
            }

            // Fetch inflation data for each token
            const inflationData = [];
            for (const asset of assetList) {
                try {
                    // Query last inflation
                    const params = {
                        path: `"/shell/value/#tnam1pyqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqej6juv/#${asset.address}/parameters/last_inflation"`
                    };
                    const queryString = new URLSearchParams(params).toString();
                    // console.log('Inflation Query URL:', `${config.namadaRpcUrl}/abci_query?${queryString}`);
                    const inflationResponse = await axios.get(`${config.namadaRpcUrl}/abci_query`, {
                        params
                    });

                    // Query last locked amount
                    const lockedParams = {
                        path: `"/shell/value/#tnam1pyqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqej6juv/#${asset.address}/parameters/last_locked_amount"`
                    };
                    const lockedQueryString = new URLSearchParams(lockedParams).toString();
                    // console.log('Locked Amount Query URL:', `${config.namadaRpcUrl}/abci_query?${lockedQueryString}`);
                    const lockedResponse = await axios.get(`${config.namadaRpcUrl}/abci_query`, {
                        params: lockedParams
                    });

                    if (!inflationResponse.data?.result?.response?.value ||
                        !lockedResponse.data?.result?.response?.value) {
                        console.log(`No inflation data for token ${asset.address}`);
                        inflationData.push({
                            address: asset.address,
                            last_locked: null,
                            last_inflation: null
                        });
                        continue;
                    }

                    // Decode both values using WASM
                    const lastInflation = wasmService.decodeAbciAmount(inflationResponse.data.result.response.value);
                    const lastLocked = wasmService.decodeAbciAmount(lockedResponse.data.result.response.value);

                    inflationData.push({
                        address: asset.address,
                        last_locked: lastLocked,
                        last_inflation: lastInflation
                    });

                    // Add delay between assets
                    await this.delay(1000);
                } catch (error) {
                    console.log(`Inflation query failed for ${asset.address}: ${error.message}`);
                    inflationData.push({
                        address: asset.address,
                        last_locked: null,
                        last_inflation: null
                    });
                }
            }

            // Update the stored data
            this.maspInflation = inflationData;
            return this.maspInflation;
        } catch (error) {
            console.error("Error fetching MASP inflation:", error);
            return [];
        }
    }

    startUpdates() {
        const refreshMillis = 60000; // 60 seconds
        setInterval(() => this.fetchAllTokenSupplies(), refreshMillis);
        setInterval(() => this.fetchRewardTokens(), refreshMillis);
        setInterval(() => this.fetchTotalRewards(), refreshMillis);
        setInterval(() => this.fetchMaspEpoch(), refreshMillis);
        setInterval(() => this.fetchMaspInflation(), refreshMillis);
        this.fetchAllTokenSupplies(); // Initial fetch
        this.fetchRewardTokens(); // Initial fetch
        this.fetchTotalRewards(); // Initial fetch
        this.fetchMaspEpoch(); // Initial fetch
        this.fetchMaspInflation(); // Initial fetch
    }

    getTokenSupplies() {
        return this.tokenSupplies;
    }

    getRewardTokens() {
        return this.rewardTokens;
    }

    getTotalRewards() {
        return this.totalRewards;
    }

    getMaspEpoch() {
        return this.maspEpoch;
    }

    getMaspInflation() {
        return this.maspInflation;
    }
}

export const namadaService = new NamadaService(); 