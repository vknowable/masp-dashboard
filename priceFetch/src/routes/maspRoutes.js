import express from 'express';
import { dbService } from '../services/dbService.js';

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

export default router; 