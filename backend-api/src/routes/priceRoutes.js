import express from "express";
import { priceService } from "../services/priceService.js";

const router = express.Router();

router.get("/all/price", async (req, res) => {
  try {
    const allPrices = priceService.getAllPrices();
    if (!allPrices || allPrices.length === 0) {
      return res.status(503).json({ 
        error: "Price data temporarily unavailable",
        attribution: "Price data by CoinGecko"
      });
    }
    res.json({
      attribution: "Price data by CoinGecko",
      price: allPrices
    });
  } catch (error) {
    console.error("Error fetching all prices:", error);
    res.status(500).json({ 
      error: "Internal server error while fetching prices",
      attribution: "Price data by CoinGecko"
    });
  }
});

router.get("/:asset/price", async (req, res) => {
  try {
    const asset = req.params.asset?.toLowerCase();
    if (!asset) {
      return res.status(400).json({ 
        error: "Asset parameter is required",
        attribution: "Price data by CoinGecko"
      });
    }

    const price = priceService.getPrice(asset);
    if (!price) {
      return res.status(404).json({ 
        error: "Asset not found",
        attribution: "Price data by CoinGecko"
      });
    }
    
    res.json({
      attribution: "Price data by CoinGecko",
      price: price
    });
  } catch (error) {
    console.error(`Error fetching price for ${req.params.asset}:`, error);
    res.status(500).json({ 
      error: "Internal server error while fetching price",
      attribution: "Price data by CoinGecko"
    });
  }
});

export default router; 