import express from "express";
import rateLimit from "express-rate-limit";
import axios from "axios";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();
app.use(cors()); // Allow all origins

const REFRESH_SECS = process.env.REFRESH_SECS || 300;
const REQUEST_LIMIT = process.env.REQUEST_LIMIT || 100;
const SERVE_PORT = process.env.SERVE_PORT || 5337;
const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY;
const assetListUrl = "https://raw.githubusercontent.com/vknowable/mock-registry/refs/heads/main/namada/assetlist.json"

const prices = {};

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function shuffleArray(array) {
  return array.sort(() => Math.random() - 0.5);
}

// Limit to (default 100) incoming requests per minute per IP
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: REQUEST_LIMIT,
  message: "Too many requests, please try again later."
});
app.use(limiter);

// Get the list of registered assets from the chain registry
async function fetchAssetList() {
  try {
    const response = await axios.get(assetListUrl);
    const registryAssets = response.data.assets || [];
    return registryAssets
      .map(asset => asset.coingecko_id)
      .filter(id => id && id.trim() !== "");
  } catch (error) {
    console.error("Error fetching asset list:", error.message);
    return []; // Return an empty array on failure
  }
}

// Refresh prices every (default 60) seconds (the actual interval will be longer depending on the value of delay() * assets.len() in the loop below)
async function fetchPrices() {
  const assetList = await fetchAssetList();
  // Hack to get around coingecko's over-enthusiastic rate limiting; we randomize the order in which we fetch the prices, so if an asset at the end of the 
  // list gets 429'd, it will have a chance to update in a future iteration
  const assets = shuffleArray([...assetList]);
  console.log(`Attempting to fetch prices for ${assets}`);
  for (const asset of assets) {
    try {
      const response = await axios.get(`https://api.coingecko.com/api/v3/simple/price`, {
        params: { ids: asset, vs_currencies: "usd" },
        headers: {
                  accept: "application/json",
                  "api-key": COINGECKO_API_KEY,
                },
      });
      prices[asset] = response.data[asset];
    } catch (error) {
      console.error(`Error fetching price for ${asset}:`, error.message);
    }

    // Short pause between fetching each asset to avoid being rate-limited
    await delay(10000);
  }
  console.log(`Complete. Sleeping for ${REFRESH_SECS} seconds.`);
}
const refreshMillis = REFRESH_SECS * 1000;
setInterval(fetchPrices, refreshMillis);
fetchPrices(); // Initial fetch

// API route to get price
app.get("/api/v1/:asset/price", (req, res) => {
  const asset = req.params.asset.toLowerCase();
  if (!prices[asset]) {
    return res.status(404).json({ error: "Asset not found" });
  }
  res.json({ 
    attribution: "Price data by CoinGecko",
    [asset]: { 
        usd: prices[asset].usd 
    } 
    });
});

app.listen(SERVE_PORT, () => console.log(`Server running on port ${SERVE_PORT}`));
