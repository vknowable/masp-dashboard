import axios from "axios";
import { config } from "../config.js";
import { wasmService } from "./wasmService.js";
import { priceService } from "./priceService.js";
import pkg from 'pg';
const { Pool } = pkg;

export const pgfAddress = "tnam1pgqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqkhgajr"
export const MASP_ADDRESS = "tnam1pcqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzmefah";
// needed to sync shielded context
export const DUMMY_VIEWING_KEY = {
    key: "zvknam1qvde8lfyqqqqpqryctpy3fkrlfq77g90mupqgxfkjgdcr7633llu8muvj2nys386kfpnh730szzzjda2ewcnlplcns5egsggcvk7dxs2mfme73se4pydcalm7y4rqaqtktjawwmwywlxst0d4f77gkz56st2lgz4lc2u5mvrdnmhnrpgyk9jg5gef97u6fjerp2axsfpyrryr8f6l5ukwnmxyuhtk2evs4cl2d99tka4p78nredyulukwkw5ly0eluht984a995272gudulkf",
    birthday: 0
}

class NamadaService {
    constructor() {
        this.currentHeight = 0;
        this.tokenSupplies = [];
        this.rewardTokens = null;
        this.totalRewards = null;
        this.maspEpoch = null;
        this.maspInflation = [];
        this.pgfBalance = null;
        this.simulatedRewards = null;
        this.maspBalances = [];
        this.chainStatistics = { transactionCount: 0, uniqueAddressCount: 0, feesCollected: "0" }; // Initialize chain statistics

        // Initialize Database Pool if not in mock mode
        if (!config.dbMockMode) {
            this.pool = new Pool({
                user: config.dbUser,
                host: config.dbHost,
                database: config.dbName,
                password: config.dbPassword,
                port: config.dbPort,
            });

            this.pool.on('error', (err, client) => {
                console.error('Unexpected error on idle client', err);
                process.exit(-1);
            });
        }

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
                    if (parseInt(height) === parseInt(this.currentHeight)) {
                        console.log("Setting pgf balance:", decodedBalance);
                        this.pgfBalance = decodedBalance.toString();
                    }
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
            this.currentHeight = currentHeight;

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
                    await wasmService.ensureRequiredFiles();
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
                            "1000000"
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

    async fetchSimulatedRewards2() {
        console.log("Starting fetchSimulatedRewards2");
        try {
            // Check if maspInflation data is available
            if (!this.maspInflation || this.maspInflation.length === 0) {
                console.log('No MASP inflation data available for simulated rewards calculation');
                return null;
            }

            console.log(`Calculating simulated rewards for ${this.maspInflation.length} assets`);

            const rewards = [];
            for (const inflationData of this.maspInflation) {
                const { address, last_inflation, last_locked } = inflationData;

                try {
                    let rawAmount = "0";

                    // Calculate rewards as last_inflation / last_locked
                    if (last_inflation !== null && last_locked !== null && last_locked > 0) {
                        const rewardRate = last_inflation / last_locked;
                        rawAmount = rewardRate.toString();
                        console.log(`Calculated reward rate for ${address}: ${rawAmount} (inflation: ${last_inflation}, locked: ${last_locked})`);
                    } else {
                        console.log(`Skipping ${address} - missing or invalid inflation/locked data (inflation: ${last_inflation}, locked: ${last_locked})`);
                    }

                    rewards.push({
                        token_address: address,
                        raw_amount: rawAmount
                    });

                } catch (error) {
                    console.error(`Error calculating rewards for ${address}:`, error);
                    rewards.push({
                        token_address: address,
                        raw_amount: "0"
                    });
                }
            }

            const result = {
                timestamp: Date.now(),
                rewards: rewards
            };

            console.log("Completed fetchSimulatedRewards2 with results:", {
                timestamp: result.timestamp,
                rewardCount: rewards.length
            });

            this.simulatedRewards = result;
            return result;

        } catch (error) {
            console.error("Top level error in fetchSimulatedRewards2:", error);
            console.error("Error details:", {
                message: error.message,
                stack: error.stack
            });
            return null;
        }
    }

    async fetchMaspBalances() {
        console.log("Fetching MASP balances");
        try {
            // Get list of registered assets
            const assetList = await this.fetchAssetList();
            if (!assetList || assetList.length === 0) {
                throw new Error("Failed to fetch asset list");
            }

            console.log(`Fetching MASP balances for ${assetList.length} assets`);

            // Fetch balances for each token at MASP address
            const maspBalances = [];
            for (const asset of assetList) {
                try {
                    const balancePath = `"/shell/value/#tnam1pyqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqej6juv/#${asset.address}/balance/#${MASP_ADDRESS}"`;
                    const balanceResponse = await this.queryWithRetry(async () => {
                        return await axios.get(`${config.namadaRpcUrl}/abci_query`, {
                            params: {
                                path: balancePath
                            }
                        });
                    });

                    if (!balanceResponse?.data?.result?.response?.value) {
                        console.log(`No MASP balance data for token ${asset.address}`);
                        maspBalances.push({
                            tokenAddress: asset.address,
                            minDenomAmount: "0"
                        });
                        continue;
                    }

                    // Decode the ABCI value using WASM
                    const decodedBalance = wasmService.decodeAbciAmount(balanceResponse.data.result.response.value);

                    maspBalances.push({
                        tokenAddress: asset.address,
                        minDenomAmount: decodedBalance.toString()
                    });

                    // Add delay between assets
                    await this.delay(500);
                } catch (error) {
                    console.log(`MASP balance query failed for ${asset.address}: ${error.message}`);
                    maspBalances.push({
                        tokenAddress: asset.address,
                        minDenomAmount: "0"
                    });
                }
            }

            this.maspBalances = maspBalances;
            console.log(`Updated MASP balances for ${maspBalances.length} assets`);
            return maspBalances;
        } catch (error) {
            console.error("Error fetching MASP balances:", error);
            return []; // Return empty array instead of throwing
        }
    }

    async calculateFeesCollected() {
        if (config.dbMockMode) {
            return "123.45"; // Return dummy value for mock mode
        }

        if (!this.pool) {
            console.error("Database pool is not initialized. Cannot calculate fees collected.");
            return "0";
        }

        try {
            console.log("Calculating total fees collected...");

            // Get all wrapper transactions with fee_token and gas_limit
            const result = await this.pool.query(
                'SELECT fee_token, gas_limit FROM public.wrapper_transactions'
            );

            if (result.rows.length === 0) {
                console.log("No wrapper transactions found");
                return "0";
            }

            // Get asset list to map tokens to their decimals and coingecko_ids
            const assetList = await this.fetchAssetList();
            if (!assetList || assetList.length === 0) {
                console.error("Failed to fetch asset list for fees calculation");
                return "0";
            }

            // Create a map of token address to asset info
            const assetMap = new Map();
            assetList.forEach(asset => {
                assetMap.set(asset.address, asset);
            });

            let totalFeesUsd = 0;
            const processedTokens = new Set(); // Track which tokens we've processed to avoid logging duplicate warnings

            for (const row of result.rows) {
                const { fee_token, gas_limit } = row;

                if (!fee_token || !gas_limit) {
                    continue; // Skip rows with missing data
                }

                // Look up asset info
                const asset = assetMap.get(fee_token);
                let decimals = 6; // Default to 6 decimals if asset not found
                let coingeckoId = null;

                if (asset) {
                    decimals = asset.decimals ?? 6; // Use asset decimals or default to 6
                    coingeckoId = asset.coingecko_id;
                } else {
                    if (!processedTokens.has(fee_token)) {
                        console.warn(`Asset not found for fee token: ${fee_token}, using default decimals (6)`);
                        processedTokens.add(fee_token);
                    }
                }

                // Calculate actual fee amount using decimals
                const feeAmount = parseFloat(gas_limit) / Math.pow(10, decimals);

                // Get USD price for this token (skip if no coingecko_id available)
                if (!coingeckoId) {
                    if (!processedTokens.has(fee_token)) {
                        console.warn(`No coingecko_id available for token: ${fee_token}, skipping price lookup`);
                        processedTokens.add(fee_token);
                    }
                    continue;
                }

                const priceData = priceService.getPrice(coingeckoId);
                if (!priceData || !priceData.usd) {
                    if (!processedTokens.has(fee_token)) {
                        console.warn(`Price not available for token: ${coingeckoId}`);
                        processedTokens.add(fee_token);
                    }
                    continue;
                }

                // Calculate USD value and add to total
                const feeUsd = feeAmount * priceData.usd;
                totalFeesUsd += feeUsd;
            }

            console.log(`Total fees collected: $${totalFeesUsd.toFixed(2)} USD`);
            return totalFeesUsd.toFixed(2);

        } catch (error) {
            console.error("Error calculating fees collected:", error);
            return "0";
        }
    }

    async fetchChainStatistics() {
        console.log("Fetching chain statistics");
        if (config.dbMockMode) {
            console.log("DB Mock Mode: Updating with dummy chain statistics");
            this.chainStatistics = {
                transactionCount: 12345, // Dummy transaction count
                uniqueAddressCount: 6789,   // Dummy unique address count
                feesCollected: "123.45" // Dummy fees collected
            };
            return; // Exit early for mock mode
        }

        if (!this.pool) {
            console.error("Database pool is not initialized. Cannot fetch chain statistics.");
            return;
        }

        try {
            const [txCountResult, uniqueAddressCountResult, feesCollected] = await Promise.all([
                this.pool.query('SELECT COUNT(*) AS tx_count FROM public.inner_transactions'),
                this.pool.query('SELECT COUNT(*) AS address_count FROM public.balances'),
                this.calculateFeesCollected()
            ]);

            const transactionCount = parseInt(txCountResult.rows[0].tx_count, 10);
            const uniqueAddressCount = parseInt(uniqueAddressCountResult.rows[0].address_count, 10);

            this.chainStatistics = { transactionCount, uniqueAddressCount, feesCollected };
            console.log("Chain statistics updated:", this.chainStatistics);
        } catch (error) {
            console.error("Error fetching chain statistics for caching:", error);
        }
    }

    startUpdates() {
        const refreshMillis = config.refreshSecs * 1000;
        setInterval(() => this.fetchAllTokenSupplies(), refreshMillis);
        setInterval(() => this.fetchRewardTokens(), refreshMillis);
        setInterval(() => this.fetchTotalRewards(), refreshMillis);
        setInterval(() => this.fetchMaspEpoch(), refreshMillis);
        setInterval(() => this.fetchMaspInflation(), refreshMillis);
        setInterval(() => this.fetchSimulatedRewards2(), refreshMillis);
        setInterval(() => this.fetchChainStatistics(), refreshMillis); // Add chain statistics to periodic updates
        setInterval(() => this.fetchMaspBalances(), 20000); // Refresh MASP balances every 20 seconds

        this.fetchAllTokenSupplies(); // Initial fetch
        this.fetchRewardTokens(); // Initial fetch
        this.fetchTotalRewards(); // Initial fetch
        this.fetchMaspEpoch(); // Initial fetch
        this.fetchMaspInflation(); // Initial fetch
        this.fetchSimulatedRewards2(); // Initial fetch
        this.fetchChainStatistics(); // Initial fetch for chain statistics
        this.fetchMaspBalances(); // Initial fetch for MASP balances
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

    getMaspBalances() {
        return this.maspBalances;
    }

    // Synchronous getter for cached chain statistics
    getChainStatistics() {
        return this.chainStatistics;
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