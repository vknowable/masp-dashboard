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
router.get('/masp/reward_tokens', (req, res) => {
    const rewardTokens = namadaService.getRewardTokens();
    res.json({ rewardTokens });
});

// Get total rewards
router.get('/masp/total_rewards', (req, res) => {
    const totalRewards = namadaService.getTotalRewards();
    res.json({ totalRewards });
});

// Get MASP epoch
router.get('/masp/epoch', (req, res) => {
    const maspEpoch = namadaService.getMaspEpoch();
    res.json({ maspEpoch });
});

// Get MASP inflation data
router.get('/masp/inflation', async (req, res) => {
    try {
        const inflationData = namadaService.getMaspInflation();

        if (!inflationData || inflationData.length === 0) {
            return res.status(503).json({
                error: "MASP inflation data temporarily unavailable"
            });
        }

        res.json({
            timestamp: new Date().toISOString(),
            data: inflationData
        });
    } catch (error) {
        console.error("Error fetching MASP inflation data:", error);
        res.status(500).json({
            error: "Internal server error while fetching MASP inflation data"
        });
    }
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