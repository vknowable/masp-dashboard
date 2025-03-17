import express from 'express';
import { namadaService } from '../services/namadaService.js';

const router = express.Router();

// Get token supplies data
router.get('/token/supplies', async (req, res) => {
    try {
        const supplies = namadaService.getTokenSupplies();

        if (!supplies || supplies.length === 0) {
            return res.status(503).json({
                error: "Token supply data temporarily unavailable"
            });
        }

        res.json({
            timestamp: new Date().toISOString(),
            supplies: supplies
        });
    } catch (error) {
        console.error("Error fetching token supplies:", error);
        res.status(500).json({
            error: "Internal server error while fetching token supplies"
        });
    }
});

// Get reward tokens
router.get('/rewardtokens', (req, res) => {
    const rewardTokens = namadaService.getRewardTokens();
    res.json({ rewardTokens });
});

// Example routes (commented out until implemented)

/*
// Get latest block info
router.get('/block/latest', async (req, res) => {
  try {
    const block = await namadaService.fetchLatestBlock();
    res.json(block);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get token supply metrics
router.get('/token/supply', async (req, res) => {
  try {
    const supply = await namadaService.fetchTokenSupply();
    res.json(supply);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get MASP metrics
router.get('/masp/metrics', async (req, res) => {
  try {
    const metrics = await namadaService.fetchMaspMetrics();
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all metrics in a single call
router.get('/metrics/all', async (req, res) => {
  try {
    const [supply, block, masp] = await Promise.all([
      namadaService.fetchTokenSupply(),
      namadaService.fetchLatestBlock(),
      namadaService.fetchMaspMetrics()
    ]);
    
    res.json({
      supply,
      block,
      masp,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
*/

export default router; 