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

  async fetchPriceWithRetry(asset) {
    let lastError;
    
    for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
      try {
        const response = await axios.get(`${config.coingeckoBaseUrl}/simple/price`, {
          params: { ids: asset, vs_currencies: "usd" },
          headers: {
            accept: "application/json",
            "api-key": config.coingeckoApiKey,
          },
        });
        
        if (response.data[asset]?.usd) {
          this.prices[asset] = response.data[asset];
          return true;
        }
        
        throw new Error(`No price data received for ${asset}`);
      } catch (error) {
        lastError = error;
        
        if (error.response?.status === 429) {
          console.log(`Rate limited on attempt ${attempt} for ${asset}, backing off...`);
          await this.backoff(attempt);
        } else {
          await this.delay(2000);
        }
      }
    }
    
    console.error(`Failed to fetch price for ${asset} after ${config.maxRetries} attempts:`, lastError.message);
    return false;
  }

  async fetchPrices() {
    const assetList = await this.fetchAssetList();
    console.log(`Attempting to fetch prices for ${assetList.length} assets`);
    
    const results = await Promise.allSettled(
      assetList.map(async (asset) => {
        const success = await this.fetchPriceWithRetry(asset);
        return { asset, success };
      })
    );
    
    const failedAssets = results
      .filter(result => result.status === 'rejected' || !result.value.success)
      .map(result => result.value?.asset || 'unknown');
      
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