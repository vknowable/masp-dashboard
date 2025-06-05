import express from 'express';
import { dbService } from '../services/dbService.js';
import { MASP_ADDRESS, namadaService } from '../services/namadaService.js';

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

/// Get a series of balances at regular time intervals
/// Query parameters:
/// - startTime: ISO timestamp in UTC
/// - endTime: ISO timestamp in UTC
/// - resolution: number of hours between each tick
router.get('/balances/series', async (req, res) => {
    try {
        // Validate required query parameters
        const { startTime, endTime, resolution } = req.query;
        if (!startTime || !endTime || !resolution) {
            return res.status(400).json({
                error: 'Missing required parameters: startTime, endTime, resolution'
            });
        }

        // Parse and validate dates
        const queryStartTime = new Date(startTime);
        const queryEndTime = new Date(endTime);
        if (isNaN(queryStartTime.getTime()) || isNaN(queryEndTime.getTime())) {
            return res.status(400).json({
                error: 'Invalid date format. Use ISO 8601 format (e.g., 2024-03-24T00:00:00Z)'
            });
        }

        // Parse and validate resolution
        const resolutionHours = parseFloat(resolution);
        if (isNaN(resolutionHours) || resolutionHours <= 0) {
            return res.status(400).json({
                error: 'Invalid resolution. Must be a positive number'
            });
        }

        // Calculate number of ticks needed
        const timeWindowHours = (queryEndTime - queryStartTime) / (1000 * 60 * 60);
        const numTicks = Math.ceil(timeWindowHours / resolutionHours);

        // Generate timestamps for each tick
        const timestamps = [];

        // Add startTime as the first tick
        timestamps.push(new Date(queryStartTime));

        // Add intermediate ticks at regular intervals
        for (let i = 1; i < numTicks; i++) {
            const timestamp = new Date(queryStartTime);
            timestamp.setHours(timestamp.getHours() + (i * resolutionHours));
            timestamps.push(timestamp);
        }

        // Add endTime as the last tick if it's different from the last calculated tick
        const lastCalculatedTick = timestamps[timestamps.length - 1];
        if (lastCalculatedTick.getTime() !== queryEndTime.getTime()) {
            timestamps.push(new Date(queryEndTime));
        }

        // Get asset list
        const assets = await namadaService.fetchAssetList();
        if (!assets || assets.length === 0) {
            throw new Error('Failed to fetch asset list');
        }

        // Get balances for all assets and timestamps
        const balances = await Promise.all(
            timestamps.map(async timestamp => {
                const balances = await dbService.fetchBalancesAtTime(
                    MASP_ADDRESS,
                    timestamp,
                    assets
                );
                return {
                    timestamp: timestamp.toISOString(),
                    balances
                };
            })
        );

        // Return response
        res.json({
            owner: MASP_ADDRESS,
            series: balances
        });

    } catch (error) {
        console.error('Error in /balances/series:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});

router.get('/count', async (req, res) => {
    try {
        const query = `
            SELECT 
                COUNT(*) FILTER (WHERE kind = 'shielding_transfer') as shielding_transfer,
                COUNT(*) FILTER (WHERE kind = 'unshielding_transfer') as unshielding_transfer,
                COUNT(*) FILTER (WHERE kind = 'shielded_transfer') as shielded_transfer,
                COUNT(*) FILTER (WHERE kind = 'ibc_shielding_transfer') as ibc_shielding_transfer,
                COUNT(*) FILTER (WHERE kind = 'ibc_unshielding_transfer') as ibc_unshielding_transfer
            FROM public.inner_transactions
            WHERE kind IN (
                'shielding_transfer',
                'unshielding_transfer',
                'shielded_transfer',
                'ibc_shielding_transfer',
                'ibc_unshielding_transfer'
            )
            AND exit_code = 'applied';
        `;

        const result = await dbService.query(query);
        const counts = result.rows[0];

        // Convert all counts to integers
        const response = {
            shielding_transfer: parseInt(counts.shielding_transfer),
            unshielding_transfer: parseInt(counts.unshielding_transfer),
            shielded_transfer: parseInt(counts.shielded_transfer),
            ibc_shielding_transfer: parseInt(counts.ibc_shielding_transfer),
            ibc_unshielding_transfer: parseInt(counts.ibc_unshielding_transfer)
        };

        res.json(response);
    } catch (error) {
        console.error('Error in masp transaction counts endpoint:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

router.get("/simulated_rewards", async (req, res) => {
    try {
        const simulatedRewards = namadaService.getSimulatedRewards();
        if (!simulatedRewards) {
            return res.status(404).json({ error: "Simulated rewards data not available" });
        }
        res.json(simulatedRewards);
    } catch (error) {
        console.error("Error fetching simulated rewards:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

export default router; 