import express from 'express';
import { namadaService, MASP_ADDRESS } from '../services/namadaService.js';

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

// Get transaction count and unique addresses from cache
router.get('/tx/count', (req, res) => {
    try {
        const stats = namadaService.getChainStatistics();

        res.json({
            timestamp: new Date().toISOString(),
            count: stats.transactionCount,
            unique_addresses: stats.uniqueAddressCount,
            fees_collected_usd: stats.feesCollected
        });
    } catch (error) {
        console.error("Error retrieving cached chain statistics:", error);
        res.status(500).json({
            error: "Internal server error while retrieving chain statistics"
        });
    }
});

// Get MASP balances for all tokens
router.get(`/account/${MASP_ADDRESS}`, async (req, res) => {
    try {
        const maspBalances = namadaService.getMaspBalances();

        if (!maspBalances || maspBalances.length === 0) {
            return res.status(503).json({
                error: "MASP balance data temporarily unavailable"
            });
        }

        res.json(maspBalances);
    } catch (error) {
        console.error("Error fetching MASP balances:", error);
        res.status(500).json({
            error: "Internal server error while fetching MASP balances"
        });
    }
});

export default router; 