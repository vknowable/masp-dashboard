import express from 'express';
import { dbService } from '../services/dbService.js';
import { namadaService } from '../services/namadaService.js';

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

        // Calculate the number of buckets needed
        const timeWindowHours = (end - start) / (1000 * 60 * 60);
        const numBuckets = Math.ceil(timeWindowHours / resolutionHours);

        // Generate the time buckets using a CTE (Common Table Expression)
        const query = `
            WITH time_buckets AS (
                SELECT generate_series(
                    $1::timestamp,
                    $2::timestamp,
                    ($3::numeric || ' hours')::interval
                ) as bucket_start,
                generate_series(
                    $1::timestamp + ($3::numeric || ' hours')::interval,
                    $2::timestamp + ($3::numeric || ' hours')::interval,
                    ($3::numeric || ' hours')::interval
                ) as bucket_end
            ),
            transactions AS (
                SELECT 
                    ita.*,
                    EXTRACT(EPOCH FROM (ita.timestamp - $1::timestamp))/3600 as hours_from_start,
                    FLOOR(EXTRACT(EPOCH FROM (ita.timestamp - $1::timestamp))/3600/$3::numeric) as bucket_index,
                    CASE 
                        WHEN kind = 'ibc_shielding_transfer' THEN 'shielded_in'
                        WHEN kind = 'ibc_unshielding_transfer' THEN 'shielded_out'
                        WHEN kind = 'ibc_transparent_transfer' AND direction = 'in' THEN 'transparent_in'
                        WHEN kind = 'ibc_transparent_transfer' AND direction = 'out' THEN 'transparent_out'
                    END as tx_type
                FROM public.ibc_transactions_applied ita
                WHERE ita.timestamp BETWEEN $1 AND $2
            )
            SELECT 
                bucket_index,
                tx_type,
                json_agg(
                    json_build_object(
                        'token_address', token_address,
                        'source', source,
                        'target', target,
                        'raw_amount', raw_amount,
                        'id', id,
                        'wrapper_id', wrapper_id,
                        'timestamp', timestamp
                    )
                ) as transactions
            FROM transactions
            GROUP BY bucket_index, tx_type
            ORDER BY bucket_index, tx_type;
        `;

        const result = await dbService.query(query, [start, end, resolutionHours]);

        // Transform the results into the desired bucket structure
        const buckets = Array.from({ length: numBuckets }, (_, i) => ({
            bucket: i,
            shielded_in: [],
            shielded_out: [],
            transparent_in: [],
            transparent_out: []
        }));

        result.rows.forEach(row => {
            const bucket = buckets[row.bucket_index];
            bucket[row.tx_type] = row.transactions;
        });

        res.json(buckets);
    } catch (error) {
        console.error('Error in IBC transactions endpoint:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

router.get('/count', async (req, res) => {
    try {
        // Get asset list
        const assets = await namadaService.fetchAssetList();
        if (!assets || assets.length === 0) {
            throw new Error('Failed to fetch asset list');
        }

        // Get counts for each token
        const counts = await Promise.all(
            assets.map(async (asset) => {
                const query = `
                    SELECT 
                        COUNT(*) FILTER (WHERE kind = 'ibc_shielding_transfer') as shielded_in,
                        COUNT(*) FILTER (WHERE kind = 'ibc_unshielding_transfer') as shielded_out,
                        COUNT(*) FILTER (WHERE kind = 'ibc_transparent_transfer' AND direction = 'in') as transparent_in,
                        COUNT(*) FILTER (WHERE kind = 'ibc_transparent_transfer' AND direction = 'out') as transparent_out
                    FROM public.ibc_transactions_applied
                    WHERE token_address = $1;
                `;

                const result = await dbService.query(query, [asset.address]);
                const counts = result.rows[0];

                return {
                    token_address: asset.address,
                    shielded_in: parseInt(counts.shielded_in),
                    shielded_out: parseInt(counts.shielded_out),
                    transparent_in: parseInt(counts.transparent_in),
                    transparent_out: parseInt(counts.transparent_out)
                };
            })
        );

        res.json(counts);
    } catch (error) {
        console.error('Error in IBC transaction counts endpoint:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

router.get('/aggregates', async (req, res) => {
    try {
        // Get asset list
        const assets = await namadaService.fetchAssetList();
        if (!assets || assets.length === 0) {
            throw new Error('Failed to fetch asset list');
        }

        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        // Get aggregates for each token
        const aggregates = await Promise.all(
            assets.map(async (asset) => {
                const query = `
                    WITH transaction_kinds AS (
                        SELECT 
                            token_address,
                            raw_amount,
                            timestamp,
                            CASE 
                                WHEN kind = 'ibc_shielding_transfer' THEN 'shieldedIn'
                                WHEN kind = 'ibc_unshielding_transfer' THEN 'shieldedOut'
                                WHEN kind = 'ibc_transparent_transfer' AND direction = 'in' THEN 'transparentIn'
                                WHEN kind = 'ibc_transparent_transfer' AND direction = 'out' THEN 'transparentOut'
                            END as kind
                        FROM public.ibc_transactions_applied
                        WHERE token_address = $1
                    ),
                    time_windows AS (
                        SELECT 
                            token_address,
                            kind,
                            SUM(raw_amount) FILTER (WHERE timestamp >= $2) as one_day,
                            SUM(raw_amount) FILTER (WHERE timestamp >= $3) as seven_days,
                            SUM(raw_amount) FILTER (WHERE timestamp >= $4) as thirty_days,
                            SUM(raw_amount) as all_time
                        FROM transaction_kinds
                        GROUP BY token_address, kind
                    )
                    SELECT 
                        token_address as "tokenAddress",
                        'oneDay' as "timeWindow",
                        kind as "kind",
                        COALESCE(one_day::text, '0') as "totalAmount"
                    FROM time_windows
                    UNION ALL
                    SELECT 
                        token_address as "tokenAddress",
                        'sevenDays' as "timeWindow",
                        kind as "kind",
                        COALESCE(seven_days::text, '0') as "totalAmount"
                    FROM time_windows
                    UNION ALL
                    SELECT 
                        token_address as "tokenAddress",
                        'thirtyDays' as "timeWindow",
                        kind as "kind",
                        COALESCE(thirty_days::text, '0') as "totalAmount"
                    FROM time_windows
                    UNION ALL
                    SELECT 
                        token_address as "tokenAddress",
                        'allTime' as "timeWindow",
                        kind as "kind",
                        COALESCE(all_time::text, '0') as "totalAmount"
                    FROM time_windows
                    ORDER BY "tokenAddress", "timeWindow", "kind";
                `;

                const result = await dbService.query(query, [
                    asset.address,
                    oneDayAgo,
                    sevenDaysAgo,
                    thirtyDaysAgo
                ]);

                return result.rows;
            })
        );

        // Flatten the array of arrays and return
        const flattenedAggregates = aggregates.flat();
        res.json(flattenedAggregates);
    } catch (error) {
        console.error('Error in IBC aggregates endpoint:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

export default router; 