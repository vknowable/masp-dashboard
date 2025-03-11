// import express from "express";
// import rateLimit from "express-rate-limit";
// import axios from "axios";
// import dotenv from "dotenv";
// import cors from "cors";

// dotenv.config();

// const app = express();
// app.use(cors()); // Allow all origins

// const REFRESH_SECS = process.env.REFRESH_SECS || 300;
// const REQUEST_LIMIT = process.env.REQUEST_LIMIT || 100;
// const SERVE_PORT = process.env.SERVE_PORT || 5337;
// const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY;
// // const assetListUrl = "https://raw.githubusercontent.com/vknowable/mock-registry/refs/heads/main/namada/assetlist.json"
// const assetListUrl = process.env.ASSET_LIST_URL;

// const prices = {};
// const MAX_RETRIES = 3;
// const INITIAL_RETRY_DELAY = 10000; // 10 seconds

// function delay(ms) {
//   return new Promise(resolve => setTimeout(resolve, ms));
// }

// // Exponential backoff with jitter
// async function backoff(attempt) {
//   const baseDelay = INITIAL_RETRY_DELAY * Math.pow(2, attempt - 1);
//   const jitter = Math.random() * 1000; // Add up to 1 second of random jitter
//   await delay(baseDelay + jitter);
// }

// function shuffleArray(array) {
//   return array.sort(() => Math.random() - 0.5);
// }

// // Limit to (default 100) incoming requests per minute per IP
// const limiter = rateLimit({
//   windowMs: 60 * 1000,
//   max: REQUEST_LIMIT,
//   message: "Too many requests, please try again later."
// });
// app.use(limiter);

// // Get the list of registered assets from the chain registry
// async function fetchAssetList() {
//   try {
//     const response = await axios.get(assetListUrl);
//     const registryAssets = response.data.assets || [];
//     return registryAssets
//       .map(asset => asset.coingecko_id)
//       .filter(id => id && id.trim() !== "");
//   } catch (error) {
//     console.error("Error fetching asset list:", error.message);
//     return []; // Return an empty array on failure
//   }
// }

// async function fetchPriceWithRetry(asset) {
//   let lastError;
  
//   for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
//     try {
//       const response = await axios.get(`https://api.coingecko.com/api/v3/simple/price`, {
//         params: { ids: asset, vs_currencies: "usd" },
//         headers: {
//           accept: "application/json",
//           "api-key": COINGECKO_API_KEY,
//         },
//       });
      
//       if (response.data[asset]?.usd) {
//         prices[asset] = response.data[asset];
//         return true;
//       }
      
//       throw new Error(`No price data received for ${asset}`);
//     } catch (error) {
//       lastError = error;
      
//       // Check if it's a rate limit error
//       if (error.response?.status === 429) {
//         console.log(`Rate limited on attempt ${attempt} for ${asset}, backing off...`);
//         await backoff(attempt);
//       } else {
//         // For other errors, wait a short time before retrying
//         await delay(2000);
//       }
//     }
//   }
  
//   console.error(`Failed to fetch price for ${asset} after ${MAX_RETRIES} attempts:`, lastError.message);
//   return false;
// }

// // Refresh prices every (default 300) seconds
// async function fetchPrices() {
//   const assetList = await fetchAssetList();
//   console.log(`Attempting to fetch prices for ${assetList.length} assets`);
  
//   const results = await Promise.allSettled(
//     assetList.map(async (asset) => {
//       const success = await fetchPriceWithRetry(asset);
//       return { asset, success };
//     })
//   );
  
//   const failedAssets = results
//     .filter(result => result.status === 'rejected' || !result.value.success)
//     .map(result => result.value?.asset || 'unknown');
    
//   if (failedAssets.length > 0) {
//     console.warn(`Failed to fetch prices for ${failedAssets.length} assets:`, failedAssets);
//   } else {
//     console.log('Successfully fetched all prices');
//   }
  
//   console.log(`Complete. Sleeping for ${REFRESH_SECS} seconds.`);
// }

// const refreshMillis = REFRESH_SECS * 1000;
// setInterval(fetchPrices, refreshMillis);
// fetchPrices(); // Initial fetch

// // API route to get all prices
// app.get("/api/v1/all/price", (req, res) => {
//   const allPrices = Object.entries(prices).map(([asset, price]) => ({
//     [asset]: {
//       usd: price.usd
//     }
//   }));

//   res.json({
//     attribution: "Price data by CoinGecko",
//     all: allPrices
//   });
// });

// // API route to get price for a specific asset
// app.get("/api/v1/:asset/price", (req, res) => {
//   const asset = req.params.asset.toLowerCase();
//   if (!prices[asset]) {
//     return res.status(404).json({ error: "Asset not found" });
//   }
//   res.json({ 
//     attribution: "Price data by CoinGecko",
//     [asset]: { 
//         usd: prices[asset].usd 
//     } 
//   });
// });

// app.listen(SERVE_PORT, () => console.log(`Server running on port ${SERVE_PORT}`));
