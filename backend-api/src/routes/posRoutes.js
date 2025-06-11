import express from 'express';
import { namadaService } from '../services/namadaService.js';

const router = express.Router();

// Get POS parameters
router.get('/params', async (req, res) => {
    try {
        const response = await namadaService.queryWithRetry(async () => {
            const result = await namadaService.fetchPosParams();
            if (!result) {
                return res.status(503).json({
                    error: "POS parameters temporarily unavailable"
                });
            }
            return res.json(result);
        });
    } catch (error) {
        console.error("Error fetching POS parameters:", error);
        res.status(500).json({
            error: "Internal server error while fetching POS parameters"
        });
    }
});

export default router; 