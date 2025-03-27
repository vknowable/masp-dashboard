import express from 'express';
import { dbService } from '../services/dbService.js';
import { MASP_ADDRESS } from '../services/namadaService.js';

const router = express.Router();

router.get('/txs', async (req, res) => {
    try {
        const { startTime, endTime, resolution } = req.query;

        // Validate required parameters
        if (!startTime || !endTime || !resolution) {
            return res.status(400).json({
                error: 'Missing required parameters',
                required: ['startTime', 'endTime', 'resolution']
            });
        }

        // Parse and validate dates
        const start = new Date(startTime);
        const end = new Date(endTime);
        const resolutionHours = Number(resolution);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({
                error: 'Invalid date format',
                message: 'Dates should be in ISO format (e.g., 2024-03-24T00:00:00Z)'
            });
        }

        if (isNaN(resolutionHours) || resolutionHours <= 0) {
            return res.status(400).json({
                error: 'Invalid resolution',
                message: 'Resolution must be a positive number'
            });
        }

        // Fetch the data
        const result = await dbService.fetchMaspPoolTransactions(start, end, resolutionHours);
        res.json(result);
    } catch (error) {
        console.error('Error in masp transactions endpoint:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/// Get balances for all assets at a specific height or time
/// Query parameters:
/// - height: number (optional, defaults to 0 for latest)
/// - time: ISO timestamp in UTC (optional, ignored if height is provided)
router.get('/balances/all', async (req, res) => {
    try {
        const { height, time } = req.query;
        let targetHeight = 0; // Default to latest height

        // If height is provided, use it
        if (height !== undefined) {
            const parsedHeight = Number(height);
            if (isNaN(parsedHeight) || parsedHeight < 0) {
                return res.status(400).json({
                    error: 'Invalid height',
                    message: 'Height must be a non-negative number'
                });
            }
            targetHeight = parsedHeight;
        }
        // If no height but time is provided, parse and validate it
        else if (time !== undefined) {
            const timestamp = new Date(time);
            if (isNaN(timestamp.getTime())) {
                return res.status(400).json({
                    error: 'Invalid time format',
                    message: 'Time should be in ISO format (e.g., 2024-03-24T00:00:00Z)'
                });
            }
            // Use fetchBalancesAtTime which will handle finding the appropriate height
            const result = await dbService.fetchBalancesAtTime(MASP_ADDRESS, timestamp);
            return res.json(result);
        }

        // Use fetchBalancesAtHeight with the determined height
        const result = await dbService.fetchBalancesAtHeight(MASP_ADDRESS, targetHeight);
        res.json(result);
    } catch (error) {
        console.error('Error in masp balances endpoint:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

export default router; 