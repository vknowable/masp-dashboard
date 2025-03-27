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

            // Create historical balances table and functions if they don't exist
            await this.createHistoricalBalancesTable();

            // Start periodic data fetching
            this.startPeriodicDataFetch();
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
        // Update historical balances every hour
        setInterval(async () => {
            try {
                const assets = await namadaService.fetchAssetList();
                const tokenAddresses = assets.map(asset => asset.address);
                await this.updateHistoricalBalances(tokenAddresses);
            } catch (error) {
                console.error('Error in periodic historical balances update:', error);
            }
        }, 60 * 60 * 1000); // 1 hour

        // Initial update
        (async () => {
            try {
                const assets = await namadaService.fetchAssetList();
                const tokenAddresses = assets.map(asset => asset.address);
                await this.updateHistoricalBalances(tokenAddresses);
            } catch (error) {
                console.error('Error in initial historical balances update:', error);
            }
        })();
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

    /// Create the masp_historical_balances table and related functions if they don't exist
    async createHistoricalBalancesTable() {
        try {
            // Create the table
            const createTableQuery = `
                CREATE TABLE IF NOT EXISTS public.masp_historical_balances (
                    id SERIAL PRIMARY KEY,
                    token_address VARCHAR(45) NOT NULL,
                    timestamp TIMESTAMP NOT NULL,
                    balance NUMERIC(78, 0) NOT NULL,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(token_address, timestamp)
                );

                -- Create index for fast lookups
                CREATE INDEX IF NOT EXISTS idx_historical_balances_lookup 
                ON public.masp_historical_balances (token_address, timestamp DESC);
            `;

            await this.query(createTableQuery);
            console.log('Historical balances table and index created/verified');

            // Create function to populate historical balances
            const createFunctionQuery = `
                CREATE OR REPLACE FUNCTION public.populate_historical_balances(
                    p_token_address VARCHAR,
                    p_start_time TIMESTAMP,
                    p_end_time TIMESTAMP
                ) RETURNS void AS $$
                BEGIN
                    INSERT INTO public.masp_historical_balances (token_address, timestamp, balance)
                    WITH RECURSIVE 
                    -- Get transactions from masp_pool
                    masp_transactions AS (
                        SELECT 
                            token_address,
                            timestamp,
                            CASE 
                                WHEN direction = 'in' THEN raw_amount
                                ELSE -raw_amount
                            END as amount_change
                        FROM public.masp_pool
                        WHERE token_address = p_token_address
                        AND timestamp BETWEEN p_start_time AND p_end_time
                    ),
                    -- Get transactions from inner_transactions
                    inner_transactions AS (
                        SELECT 
                            p_token_address as token_address,
                            b.timestamp,
                            CASE 
                                WHEN it.kind = 'unshielding_transfer' THEN -(indexed_source->>'amount')::NUMERIC
                                WHEN it.kind = 'shielding_transfer' THEN (indexed_source->>'amount')::NUMERIC
                                ELSE 0
                            END as amount_change
                        FROM public.inner_transactions it
                        JOIN public.wrapper_transactions wt ON it.wrapper_id = wt.id
                        JOIN public.blocks b ON b.height = wt.block_height
                        CROSS JOIN LATERAL jsonb_array_elements(it.data::jsonb->'sources') WITH ORDINALITY AS source(indexed_source, ord)
                        WHERE it.kind IN ('unshielding_transfer', 'shielding_transfer', 'shielded_transfer')
                        AND indexed_source->>'token' = p_token_address
                        AND ord > 1  -- Ignore first element
                        AND b.timestamp BETWEEN p_start_time AND p_end_time
                    ),
                    -- Combine all transactions
                    all_transactions AS (
                        SELECT * FROM masp_transactions
                        UNION ALL
                        SELECT * FROM inner_transactions
                    ),
                    -- Aggregate transactions by timestamp
                    balance_history AS (
                        SELECT 
                            token_address,
                            timestamp,
                            SUM(amount_change) as amount_change
                        FROM all_transactions
                        GROUP BY token_address, timestamp
                        ORDER BY timestamp ASC
                    ),
                    -- Calculate running balance
                    running_balances AS (
                        SELECT 
                            token_address,
                            timestamp,
                            SUM(amount_change) OVER (ORDER BY timestamp) as running_balance
                        FROM balance_history
                    )
                    -- Insert the running balances
                    SELECT 
                        token_address,
                        timestamp,
                        running_balance
                    FROM running_balances
                    ON CONFLICT (token_address, timestamp) 
                    DO UPDATE SET 
                        balance = EXCLUDED.balance,
                        created_at = CURRENT_TIMESTAMP;
                END;
                $$ LANGUAGE plpgsql;
            `;

            await this.query(createFunctionQuery);
            console.log('Historical balances population function created/verified');

            // Create function to get latest timestamp
            const createLatestTimestampFunction = `
                CREATE OR REPLACE FUNCTION public.get_latest_historical_balance_timestamp(
                    p_token_address VARCHAR
                ) RETURNS TIMESTAMP AS $$
                BEGIN
                    RETURN (
                        SELECT MAX(timestamp)
                        FROM public.masp_historical_balances
                        WHERE token_address = p_token_address
                    );
                END;
                $$ LANGUAGE plpgsql;
            `;

            await this.query(createLatestTimestampFunction);
            console.log('Latest timestamp function created/verified');
        } catch (error) {
            console.error('Error creating historical balances table and functions:', error);
            throw error;
        }
    }

    /// Populate historical balances for a given token and time range
    /// @param {string} tokenAddress - The token address
    /// @param {Date} startTime - Start time in UTC
    /// @param {Date} endTime - End time in UTC
    async populateHistoricalBalances(tokenAddress, startTime, endTime) {
        try {
            const query = `
                SELECT public.populate_historical_balances($1, $2, $3);
            `;
            await this.query(query, [tokenAddress, startTime, endTime]);
            console.log(`Populated historical balances for ${tokenAddress} from ${startTime} to ${endTime}`);
        } catch (error) {
            console.error('Error populating historical balances:', error);
            throw error;
        }
    }

    /// Get the latest timestamp we have historical balance data for
    /// @param {string} tokenAddress - The token address
    /// @returns {Promise<Date>} - The latest timestamp
    async getLatestHistoricalBalanceTimestamp(tokenAddress) {
        try {
            const query = `
                SELECT public.get_latest_historical_balance_timestamp($1) as latest_timestamp;
            `;
            const result = await this.query(query, [tokenAddress]);
            return result.rows[0].latest_timestamp;
        } catch (error) {
            console.error('Error getting latest historical balance timestamp:', error);
            throw error;
        }
    }

    /// Update historical balances for all tokens with new data
    /// @param {Array<string>} tokenAddresses - List of token addresses
    async updateHistoricalBalances(tokenAddresses) {
        try {
            const now = new Date();

            for (const tokenAddress of tokenAddresses) {
                const latestTimestamp = await this.getLatestHistoricalBalanceTimestamp(tokenAddress);
                if (!latestTimestamp) {
                    // If no data exists, fetch from the beginning
                    const earliestTransactionQuery = `
                        SELECT MIN(timestamp) as earliest_timestamp
                        FROM public.masp_pool
                        WHERE token_address = $1;
                    `;
                    const result = await this.query(earliestTransactionQuery, [tokenAddress]);
                    if (result.rows[0].earliest_timestamp) {
                        await this.populateHistoricalBalances(
                            tokenAddress,
                            result.rows[0].earliest_timestamp,
                            now
                        );
                    }
                } else {
                    // Update from last known timestamp
                    await this.populateHistoricalBalances(
                        tokenAddress,
                        latestTimestamp,
                        now
                    );
                }
            }
        } catch (error) {
            console.error('Error updating historical balances:', error);
            throw error;
        }
    }
}

export const dbService = new DbService(); 