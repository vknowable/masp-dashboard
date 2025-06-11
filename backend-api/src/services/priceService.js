import axios from "axios";
import { config } from "../config.js";

class PriceService {
    constructor() {
        this.prices = {};
        this.startPriceUpdates();
    }

    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async backoff(attempt) {
        const baseDelay = config.initialRetryDelay * Math.pow(2, attempt - 1);
        const jitter = Math.random() * 1000;
        await this.delay(baseDelay + jitter);
    }

    async fetchAssetList() {
        try {
            const response = await axios.get(config.assetListUrl);
            const registryAssets = response.data.assets || [];
            return registryAssets
                .map(asset => asset.coingecko_id)
                .filter(id => id && id.trim() !== "");
        } catch (error) {
            console.error("Error fetching asset list:", error.message);
            return [];
        }
    }

    async fetchPriceWithRetry(assets) {
        let lastError;

        for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
            try {
                const response = await axios.get(`${config.coingeckoBaseUrl}/simple/price`, {
                    params: { ids: assets.join(','), vs_currencies: "usd" },
                    headers: {
                        accept: "application/json",
                        "api-key": config.coingeckoApiKey,
                    },
                });

                // Update prices for all assets in the batch
                let allSuccessful = true;
                for (const asset of assets) {
                    if (response.data[asset]?.usd) {
                        this.prices[asset] = response.data[asset];
                    } else {
                        allSuccessful = false;
                        console.error(`No price data received for ${asset}`);
                    }
                }
                return allSuccessful;
            } catch (error) {
                lastError = error;

                if (error.response?.status === 429) {
                    console.log(`Rate limited on attempt ${attempt} for batch ${assets.join(',')}, backing off...`);
                    await this.backoff(attempt);
                } else {
                    await this.delay(2000);
                }
            }
        }

        console.error(`Failed to fetch prices for batch ${assets.join(',')} after ${config.maxRetries} attempts:`, lastError.message);
        return false;
    }

    async fetchPrices() {
        const assetList = await this.fetchAssetList();
        console.log(`Attempting to fetch prices for ${assetList.length} assets`);

        const results = [];
        const BATCH_SIZE = 5;

        // Process assets in batches of 5
        for (let i = 0; i < assetList.length; i += BATCH_SIZE) {
            const batch = assetList.slice(i, i + BATCH_SIZE);
            const success = await this.fetchPriceWithRetry(batch);
            results.push({ assets: batch, success });

            // Use a fixed 5-second delay between batches
            if (i + BATCH_SIZE < assetList.length) {
                await this.delay(5000);
            }
        }

        const failedAssets = results
            .filter(result => !result.success)
            .flatMap(result => result.assets);

        if (failedAssets.length > 0) {
            console.warn(`Failed to fetch prices for ${failedAssets.length} assets:`, failedAssets);
        } else {
            console.log('Successfully fetched all prices');
        }

        console.log(`Complete. Sleeping for ${config.refreshSecs} seconds.`);
    }

    startPriceUpdates() {
        const refreshMillis = config.refreshSecs * 1000;
        setInterval(() => this.fetchPrices(), refreshMillis);
        this.fetchPrices(); // Initial fetch
    }

    getPrice(asset) {
        const price = this.prices[asset.toLowerCase()];
        if (!price) return null;
        return {
            id: asset,
            usd: price.usd
        };
    }

    getAllPrices() {
        return Object.entries(this.prices).map(([asset, price]) => (
            {
                id: asset,
                usd: price.usd
            }
        ));
    }
}

export const priceService = new PriceService(); 