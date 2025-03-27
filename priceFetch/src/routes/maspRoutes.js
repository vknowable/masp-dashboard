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
    const startTime = Date.now();
    try {
        const { startTime: queryStartTime, endTime, resolution } = req.query;

        // Validate required parameters
        if (!queryStartTime || !endTime || !resolution) {
            return res.status(400).json({
                error: 'Missing required parameters',
                required: ['startTime', 'endTime', 'resolution']
            });
        }

        // Parse and validate dates
        const start = new Date(queryStartTime);
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

        // Fetch asset list once at the start
        const assetListStart = Date.now();
        const assetList = await namadaService.fetchAssetList();
        console.log(`Initial asset list fetch took ${Date.now() - assetListStart}ms`);

        if (!assetList || assetList.length === 0) {
            throw new Error("Failed to fetch asset list");
        }

        // Get exact heights for start and end times in parallel
        console.log('Fetching start and end heights...');
        const [startHeight, endHeight] = await Promise.all([
            dbService.fetchHeightAtTime(start),
            dbService.fetchHeightAtTime(end)
        ]);
        console.log(`Start height: ${startHeight}, End height: ${endHeight}`);

        // Calculate the number of ticks needed
        const timeWindowHours = (end - start) / (1000 * 60 * 60);
        const numTicks = Math.ceil(timeWindowHours / resolutionHours) + 1; // +1 to include endTime

        console.log(`Processing ${numTicks} ticks from ${start.toISOString()} to ${end.toISOString()}`);

        // Generate array of timestamps for each tick
        const timestamps = Array.from({ length: numTicks }, (_, i) => {
            const tickTime = new Date(start);
            tickTime.setHours(start.getHours() + (i * resolutionHours));
            // Ensure the last tick is exactly at endTime
            return i === numTicks - 1 ? end : tickTime;
        });

        const timestampGenTime = Date.now();
        console.log(`Timestamp generation took ${timestampGenTime - startTime}ms`);

        // Calculate heights for all ticks using interpolation
        console.log('Calculating heights for ticks...');
        const heightPromises = timestamps.map(timestamp =>
            dbService.fetchHeightAtTime(timestamp, { startHeight, startTime: start })
        );

        const heights = await Promise.all(heightPromises);
        const heightFetchTime = Date.now();
        console.log(`All height calculations took ${heightFetchTime - timestampGenTime}ms`);

        // Filter out timestamps with no corresponding block height
        const validTicks = heights.map((height, index) => ({
            index,
            height,
            timestamp: timestamps[index]
        })).filter(tick => tick.height > 0);

        // Fetch balances for all valid heights in parallel
        console.log('Fetching balances...');
        const balancePromises = validTicks.map(async (tick) => {
            const balanceStart = Date.now();
            const balances = await dbService.fetchBalancesAtHeight(MASP_ADDRESS, tick.height, assetList);
            console.log(`Balances for tick ${tick.index} took ${Date.now() - balanceStart}ms`);
            return {
                tick: tick.index,
                timestamp: tick.timestamp.toISOString(),
                height: tick.height,
                balances
            };
        });

        const balances = await Promise.all(balancePromises);
        const balanceFetchTime = Date.now();
        console.log(`All balance fetches took ${balanceFetchTime - heightFetchTime}ms`);

        // Format the response
        const result = balances.sort((a, b) => a.tick - b.tick);

        const totalTime = Date.now() - startTime;
        console.log(`Total request processing took ${totalTime}ms`);

        res.json(result);
    } catch (error) {
        console.error('Error in masp balances series endpoint:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

export default router; 