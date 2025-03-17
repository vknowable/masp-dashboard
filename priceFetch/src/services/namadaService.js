import axios from "axios";
import { config } from "../config.js";
import { wasmService } from "./wasmService.js";

const pgfAddress = "tnam1pgqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqkhgajr"

class NamadaService {
    constructor() {
        this.tokenSupplies = [];
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
                const response = await axios.get(`${config.namadaRpcUrl}/abci_query`, {
                    params: {
                        path: path,
                        height: height.toString()
                    }
                });

                if (!response.data?.result?.response?.value) {
                    console.log(`No supply data for token ${tokenAddress} at height ${height}`);
                    return null;
                }

                // Decode the ABCI value using WASM
                const decodedSupply = wasmService.decodeAbciValue(response.data.result.response.value);

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
                    const decodedBalance = wasmService.decodeAbciValue(balanceResponse.data.result.response.value);
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
            const tokenSupplies = await Promise.all(
                assetList.map(async (asset) => {
                    // Handle each timeframe independently
                    const [current, oneDayAgo, sevenDaysAgo, thirtyDaysAgo] = await Promise.all([
                        this.fetchTokenSupply(asset.address, heights.current).catch(() => null),
                        this.fetchTokenSupply(asset.address, heights.oneDayAgo).catch(() => null),
                        this.fetchTokenSupply(asset.address, heights.sevenDaysAgo).catch(() => null),
                        this.fetchTokenSupply(asset.address, heights.thirtyDaysAgo).catch(() => null)
                    ]);

                    return {
                        address: asset.address,
                        supplies: {
                            current,
                            '1dAgo': oneDayAgo,
                            '7dAgo': sevenDaysAgo,
                            '30dAgo': thirtyDaysAgo
                        }
                    };
                })
            );

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

    startUpdates() {
        const refreshMillis = 60000; // 60 seconds
        setInterval(() => this.fetchAllTokenSupplies(), refreshMillis);
        this.fetchAllTokenSupplies(); // Initial fetch
    }

    getTokenSupplies() {
        return this.tokenSupplies;
    }
}

export const namadaService = new NamadaService(); 