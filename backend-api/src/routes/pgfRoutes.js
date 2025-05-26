import express from 'express';
import { namadaService } from '../services/namadaService.js';
import { pgfAddress } from '../services/namadaService.js';

const router = express.Router();

// Get PGF treasury balance
router.get('/treasury', async (req, res) => {
    try {
        const balance = namadaService.getPgfBalance();

        if (balance === null) {
            return res.status(503).json({
                error: "PGF treasury balance temporarily unavailable"
            });
        }

        res.json({
            address: pgfAddress,
            balance: balance
        });
    } catch (error) {
        console.error("Error fetching PGF treasury balance:", error);
        res.status(500).json({
            error: "Internal server error while fetching PGF treasury balance"
        });
    }
});

export default router; 