import axios from "axios";
import { config } from "../config.js";
import { wasmService } from "./wasmService.js";

export const pgfAddress = "tnam1pgqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqkhgajr"
export const MASP_ADDRESS = "tnam1pcqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzmefah";
// needed to sync shielded context
export const DUMMY_VIEWING_KEY = {
    key: "zvknam1qvde8lfyqqqqpqryctpy3fkrlfq77g90mupqgxfkjgdcr7633llu8muvj2nys386kfpnh730szzzjda2ewcnlplcns5egsggcvk7dxs2mfme73se4pydcalm7y4rqaqtktjawwmwywlxst0d4f77gkz56st2lgz4lc2u5mvrdnmhnrpgyk9jg5gef97u6fjerp2axsfpyrryr8f6l5ukwnmxyuhtk2evs4cl2d99tka4p78nredyulukwkw5ly0eluht984a995272gudulkf",
    birthday: 0
}

class NamadaService {
    constructor() {
        this.tokenSupplies = [];
        this.rewardTokens = null;
        this.totalRewards = null;
        this.maspEpoch = null;
        this.maspInflation = [];
        this.pgfBalance = null;
        this.simulatedRewards = null;

        // Initialize WASM module first, then start updates
        wasmService.init()
            .then(() => {
                console.log("WASM initialized, starting updates");
                this.startUpdates();
            })
            .catch(error => {
                console.error("Failed to initialize WASM:", error);
            });
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
                    // Store the PGF balance
                    this.pgfBalance = decodedBalance.toString();
                    return (decodedSupply - decodedBalance).toString();
                }

                return decodedSupply.toString();
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

            // Fetch inflation data for each token
            const inflationData = [];
            for (const asset of assetList) {
                try {
                    // Query current inflation
                    const params = {
                        path: `"/shell/value/#tnam1pyqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqej6juv/#${asset.address}/parameters/last_inflation"`
                    };
                    const inflationResponse = await axios.get(`${config.namadaRpcUrl}/abci_query`, {
                        params
                    });

                    // Query current locked amount
                    const lockedParams = {
                        path: `"/shell/value/#tnam1pyqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqej6juv/#${asset.address}/parameters/last_locked_amount"`
                    };
                    const lockedResponse = await axios.get(`${config.namadaRpcUrl}/abci_query`, {
                        params: lockedParams
                    });

                    // Query historical inflation values
                    const [oneDayAgoInflation, sevenDaysAgoInflation, thirtyDaysAgoInflation] = await Promise.all([
                        this.queryWithRetry(async () => {
                            const response = await axios.get(`${config.namadaRpcUrl}/abci_query`, {
                                params: {
                                    ...params,
                                    height: heights.oneDayAgo.toString()
                                }
                            });
                            return response.data?.result?.response?.value ?
                                wasmService.decodeAbciAmount(response.data.result.response.value) : null;
                        }).catch(() => null),
                        this.queryWithRetry(async () => {
                            const response = await axios.get(`${config.namadaRpcUrl}/abci_query`, {
                                params: {
                                    ...params,
                                    height: heights.sevenDaysAgo.toString()
                                }
                            });
                            return response.data?.result?.response?.value ?
                                wasmService.decodeAbciAmount(response.data.result.response.value) : null;
                        }).catch(() => null),
                        this.queryWithRetry(async () => {
                            const response = await axios.get(`${config.namadaRpcUrl}/abci_query`, {
                                params: {
                                    ...params,
                                    height: heights.thirtyDaysAgo.toString()
                                }
                            });
                            return response.data?.result?.response?.value ?
                                wasmService.decodeAbciAmount(response.data.result.response.value) : null;
                        }).catch(() => null)
                    ]);

                    if (!inflationResponse.data?.result?.response?.value ||
                        !lockedResponse.data?.result?.response?.value) {
                        console.log(`No inflation data for token ${asset.address}`);
                        inflationData.push({
                            address: asset.address,
                            last_locked: null,
                            last_inflation: null,
                            historical_inflation: {
                                '1dAgo': null,
                                '7dAgo': null,
                                '30dAgo': null
                            }
                        });
                        continue;
                    }

                    // Decode both values using WASM
                    const lastInflation = wasmService.decodeAbciAmount(inflationResponse.data.result.response.value);
                    const lastLocked = wasmService.decodeAbciAmount(lockedResponse.data.result.response.value);

                    inflationData.push({
                        address: asset.address,
                        last_locked: lastLocked,
                        last_inflation: lastInflation,
                        historical_inflation: {
                            '1dAgo': oneDayAgoInflation,
                            '7dAgo': sevenDaysAgoInflation,
                            '30dAgo': thirtyDaysAgoInflation
                        }
                    });

                    // Add delay between assets
                    await this.delay(1000);
                } catch (error) {
                    console.log(`Inflation query failed for ${asset.address}: ${error.message}`);
                    inflationData.push({
                        address: asset.address,
                        last_locked: null,
                        last_inflation: null,
                        historical_inflation: {
                            '1dAgo': null,
                            '7dAgo': null,
                            '30dAgo': null
                        }
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

    async fetchSimulatedRewards() {
        console.log("Starting fetchSimulatedRewards");
        return this.queryWithRetry(async () => {
            try {
                if (!config.chainId) {
                    console.error("Chain ID not configured in config");
                    throw new Error("Chain ID not configured");
                }
                console.log("Using chain ID:", config.chainId);

                // First sync the shielded context with empty viewing keys
                console.log("Attempting to sync shielded context...");
                try {
                    await wasmService.getNamadaSdk().rpc.shieldedSync([DUMMY_VIEWING_KEY], config.chainId);
                    console.log("Shielded context synced successfully");
                } catch (syncError) {
                    console.error("Failed to sync shielded context:", syncError);
                    throw syncError;
                }

                console.log("Fetching asset list...");
                const assets = await this.fetchAssetList();
                if (!assets || assets.length === 0) {
                    console.log('No assets available for simulated rewards');
                    return null;
                }
                console.log(`Found ${assets.length} assets to process`);

                const rewards = [];
                for (const asset of assets) {
                    try {
                        console.log(`Processing asset: ${asset.address}`);
                        console.log(config.chainId);
                        // Simulate rewards for 1 token as a baseline
                        console.log(`Simulating rewards for ${asset.address}...`);
                        const simulatedAmount = await wasmService.getNamadaSdk().rpc.simulateShieldedRewards(
                            config.chainId,
                            asset.address,
                            "1"
                        );
                        console.log(`Simulation result for ${asset.address}:`, simulatedAmount.toString());

                        rewards.push({
                            token_address: asset.address,
                            raw_amount: simulatedAmount.toString()
                        });

                        // Add delay between assets
                        console.log(`Waiting 1 second before next asset...`);
                        await this.delay(1000);
                    } catch (error) {
                        console.error(`Simulated rewards query failed for ${asset.address}:`, error);
                        console.error("Error details:", {
                            message: error.message,
                            stack: error.stack
                        });
                        rewards.push({
                            token_address: asset.address,
                            raw_amount: "0"
                        });
                    }
                }

                const result = {
                    timestamp: Date.now(),
                    rewards: rewards
                };

                console.log("Completed fetchSimulatedRewards with results:", {
                    timestamp: result.timestamp,
                    rewardCount: rewards.length
                });

                this.simulatedRewards = result;
                return result;
            } catch (error) {
                console.error("Top level error in fetchSimulatedRewards:", error);
                console.error("Error details:", {
                    message: error.message,
                    stack: error.stack
                });
                return null;
            }
        });
    }

    startUpdates() {
        const refreshMillis = config.refreshSecs * 1000;
        setInterval(() => this.fetchAllTokenSupplies(), refreshMillis);
        setInterval(() => this.fetchRewardTokens(), refreshMillis);
        setInterval(() => this.fetchTotalRewards(), refreshMillis);
        setInterval(() => this.fetchMaspEpoch(), refreshMillis);
        setInterval(() => this.fetchMaspInflation(), refreshMillis);
        setInterval(() => this.fetchSimulatedRewards(), refreshMillis);

        this.fetchAllTokenSupplies(); // Initial fetch
        this.fetchRewardTokens(); // Initial fetch
        this.fetchTotalRewards(); // Initial fetch
        this.fetchMaspEpoch(); // Initial fetch
        this.fetchMaspInflation(); // Initial fetch
        this.fetchSimulatedRewards(); // Initial fetch
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

    getPgfBalance() {
        return this.pgfBalance;
    }

    getSimulatedRewards() {
        return this.simulatedRewards;
    }

    async fetchPosParams() {
        console.log("Fetching POS parameters");
        return this.queryWithRetry(async () => {
            try {
                const response = await axios.get(`${config.namadaRpcUrl}/abci_query`, {
                    params: {
                        path: '"/vp/pos/pos_params"'
                    }
                });

                if (!response.data?.result?.response?.value) {
                    console.log('No POS parameters data available');
                    return null;
                }

                // Decode the ABCI value using WASM
                const decodedParams = wasmService.decodeAbciPosParams(response.data.result.response.value);
                return decodedParams;
            } catch (error) {
                console.log(`POS parameters query failed: ${error.message}`);
                return null;
            }
        });
    }
}

export const namadaService = new NamadaService(); 