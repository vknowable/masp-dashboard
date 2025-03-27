import pg from 'pg';
import { config } from '../config.js';
import { namadaService } from './namadaService.js';

const { Pool } = pg;

class DbService {
    constructor() {
        this.pool = null;
        this.latestData = null; // placeholder for now
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;

        try {
            this.pool = new Pool({
                user: config.dbUser,
                host: config.dbHost,
                database: config.dbName,
                password: config.dbPassword,
                port: config.dbPort,
            });

            // Test the connection
            await this.pool.query('SELECT NOW()');
            this.initialized = true;
            console.log('Database connection established successfully');

            // Start the periodic data fetch
            // this.startPeriodicDataFetch();
        } catch (error) {
            console.error('Failed to initialize database connection:', error);
            throw error;
        }
    }

    async query(text, params) {
        if (!this.initialized) {
            throw new Error('Database service not initialized');
        }

        try {
            const result = await this.pool.query(text, params);
            return result;
        } catch (error) {
            console.error('Database query error:', error);
            throw error;
        }
    }

    startPeriodicDataFetch() {
        // Nothing here yet


        // Placeholder: Refresh some db query every 60 seconds
        // setInterval(() => {
        //     this.fetchSomeData().catch(error => {
        //         console.error('Error in periodic database fetch:', error);
        //     });
        // }, 60000); // 60 seconds

        // Placeholder: Initial fetch for above
        // this.fetchSomeData().catch(error => {
        //     console.error('Error in initial database fetch:', error);
        // });

    }

    getLatestData() {
        return this.latestData;
    }

    /// Fetch masp pool flows for a given time window and bucket resolution
    /// The time window should be defined in UTC as this is how the data is stored by namada-indexer
    /// @param {Date} startTime - The start time of the time window (assumes UTC)
    /// @param {Date} endTime - The end time of the time window (assumes UTC)
    /// @param {number} resolutionHours - The resolution of the buckets in hours
    /// @returns {Promise<Object>} - A promise that resolves to an object containing the buckets
    async fetchMaspPoolTransactions(startTime, endTime, resolutionHours) {
        try {
            // Calculate the number of buckets needed
            const timeWindowHours = (endTime - startTime) / (1000 * 60 * 60);
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
                        mp.*,
                        EXTRACT(EPOCH FROM (mp.timestamp - $1::timestamp))/3600 as hours_from_start,
                        FLOOR(EXTRACT(EPOCH FROM (mp.timestamp - $1::timestamp))/3600/$3::numeric) as bucket_index
                    FROM public.masp_pool mp
                    WHERE mp.timestamp BETWEEN $1 AND $2
                )
                SELECT 
                    bucket_index,
                    direction,
                    json_agg(
                        json_build_object(
                            'id', id,
                            'token_address', token_address,
                            'timestamp', timestamp,
                            'raw_amount', raw_amount,
                            'inner_tx_id', inner_tx_id
                        )
                    ) as transactions
                FROM transactions
                GROUP BY bucket_index, direction
                ORDER BY bucket_index, direction;
            `;

            const result = await this.query(query, [startTime, endTime, resolutionHours]);

            // Transform the results into an array format
            const buckets = Array.from({ length: numBuckets }, (_, i) => ({
                bucket: i,
                in: [],
                out: []
            }));

            result.rows.forEach(row => {
                const bucket = buckets[row.bucket_index];
                if (row.direction === 'in') {
                    bucket.in = row.transactions;
                } else {
                    bucket.out = row.transactions;
                }
            });

            return buckets;
        } catch (error) {
            console.error('Error fetching masp pool transactions:', error);
            throw error;
        }
    }

    /// Fetch the balance for a given owner and token at a specific height
    /// If height is 0, it will fetch the balance at the latest block height
    /// If no balance exists at the given height, it will find the closest previous height with a balance
    /// @param {string} owner - The owner address
    /// @param {string} token - The token address
    /// @param {number} height - The block height (0 for latest)
    /// @returns {Promise<Object>} - A promise that resolves to the balance information
    async fetchBalanceAtHeight(owner, token, height) {
        const startTime = Date.now();
        try {
            let targetHeight = height;

            // If height is 0, get the latest block height
            if (height === 0) {
                const latestBlockQuery = 'SELECT MAX(height) as max_height FROM public.blocks';
                const latestBlockStart = Date.now();
                const latestBlockResult = await this.query(latestBlockQuery);
                console.log(`Latest block query took ${Date.now() - latestBlockStart}ms`);
                targetHeight = latestBlockResult.rows[0].max_height;
            }

            // Query to find the closest balance at or before the target height
            const query = `
                SELECT 
                    token,
                    raw_amount
                FROM public.balance_changes
                WHERE owner = $1 
                AND token = $2 
                AND height <= $3
                ORDER BY height DESC
                LIMIT 1;
            `;

            const balanceStart = Date.now();
            const result = await this.query(query, [owner, token, targetHeight]);
            console.log(`Balance query took ${Date.now() - balanceStart}ms`);

            if (result.rows.length === 0) {
                return {
                    token,
                    raw_amount: '0'
                };
            }

            return result.rows[0];
        } catch (error) {
            console.error('Error fetching balance at height:', error);
            throw error;
        } finally {
            console.log(`fetchBalanceAtHeight took ${Date.now() - startTime}ms`);
        }
    }

    /// Fetch the block height at or before a given timestamp
    /// @param {Date} timestamp - The timestamp in UTC
    /// @param {Object} [interpolationData] - Optional data for height interpolation
    /// @returns {Promise<number>} - A promise that resolves to the block height
    async fetchHeightAtTime(timestamp, interpolationData = null) {
        const startTime = Date.now();
        try {
            // If we have interpolation data, use it to calculate the height
            if (interpolationData) {
                const { startHeight, startTime } = interpolationData;
                const secondsDiff = (timestamp - startTime) / 1000;
                const blocksDiff = Math.round(secondsDiff / 7);
                const estimatedHeight = startHeight + blocksDiff;
                console.log(`Height interpolation took ${Date.now() - startTime}ms`);
                return estimatedHeight;
            }

            // Otherwise, query the database for the exact height
            const blockQuery = `
                SELECT height
                FROM public.blocks
                WHERE timestamp <= $1
                ORDER BY timestamp DESC
                LIMIT 1;
            `;

            const blockStart = Date.now();
            const blockResult = await this.query(blockQuery, [timestamp]);
            console.log(`Block height query took ${Date.now() - blockStart}ms`);

            if (blockResult.rows.length === 0) {
                return 0;
            }

            return blockResult.rows[0].height;
        } catch (error) {
            console.error('Error fetching height at time:', error);
            throw error;
        }
    }

    /// Fetch the balance for a given owner and token at a specific timestamp
    /// Finds the closest block height at or before the given timestamp and returns the balance
    /// @param {string} owner - The owner address
    /// @param {string} token - The token address
    /// @param {Date} timestamp - The timestamp in UTC
    /// @returns {Promise<Object>} - A promise that resolves to the balance information
    async fetchBalanceAtTime(owner, token, timestamp) {
        const startTime = Date.now();
        try {
            const height = await this.fetchHeightAtTime(timestamp);
            if (height === 0) {
                return {
                    token,
                    raw_amount: '0'
                };
            }
            return await this.fetchBalanceAtHeight(owner, token, height);
        } catch (error) {
            console.error('Error fetching balance at time:', error);
            throw error;
        } finally {
            console.log(`fetchBalanceAtTime took ${Date.now() - startTime}ms`);
        }
    }

    /// Fetch balances for all assets for a given owner at a specific height
    /// @param {string} owner - The owner address
    /// @param {number} height - The block height (0 for latest)
    /// @param {Array} [assetList] - Optional list of assets to fetch balances for. If not provided, will fetch from namadaService.
    /// @returns {Promise<Array>} - A promise that resolves to an array of balance information for each asset
    async fetchBalancesAtHeight(owner, height, assetList = null) {
        const startTime = Date.now();
        try {
            let targetHeight = height;

            // If height is 0, get the latest block height
            if (height === 0) {
                const latestBlockQuery = 'SELECT MAX(height) as max_height FROM public.blocks';
                const latestBlockStart = Date.now();
                const latestBlockResult = await this.query(latestBlockQuery);
                console.log(`Latest block query took ${Date.now() - latestBlockStart}ms`);
                targetHeight = latestBlockResult.rows[0].max_height;
            }

            // Get the list of assets if not provided
            let assets = assetList;
            if (!assets) {
                const assetListStart = Date.now();
                assets = await namadaService.fetchAssetList();
                console.log(`Asset list fetch took ${Date.now() - assetListStart}ms`);
            }

            if (!assets || assets.length === 0) {
                throw new Error("No assets provided and failed to fetch asset list");
            }

            // Fetch balance for each asset
            const balancePromises = assets.map(asset =>
                this.fetchBalanceAtHeight(owner, asset.address, targetHeight)
            );

            // Wait for all balance fetches to complete
            const balances = await Promise.all(balancePromises);

            return balances;
        } catch (error) {
            console.error('Error fetching balances at height:', error);
            throw error;
        } finally {
            console.log(`fetchBalancesAtHeight took ${Date.now() - startTime}ms`);
        }
    }

    /// Fetch balances for all assets for a given owner at a specific timestamp
    /// Finds the closest block height at or before the given timestamp and returns balances
    /// @param {string} owner - The owner address
    /// @param {Date} timestamp - The timestamp in UTC
    /// @param {Array} [assetList] - Optional list of assets to fetch balances for. If not provided, will fetch from namadaService.
    /// @returns {Promise<Array>} - A promise that resolves to an array of balance information for each asset
    async fetchBalancesAtTime(owner, timestamp, assetList = null) {
        const startTime = Date.now();
        try {
            const height = await this.fetchHeightAtTime(timestamp);
            if (height === 0) {
                return [];
            }
            return await this.fetchBalancesAtHeight(owner, height, assetList);
        } catch (error) {
            console.error('Error fetching balances at time:', error);
            throw error;
        } finally {
            console.log(`fetchBalancesAtTime took ${Date.now() - startTime}ms`);
        }
    }
}

export const dbService = new DbService(); 