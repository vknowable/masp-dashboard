import pg from 'pg';
import { config } from '../config.js';

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

            // Transform the results into the desired format
            const buckets = {};
            for (let i = 0; i < numBuckets; i++) {
                buckets[`${i * resolutionHours}hr`] = {
                    in: [],
                    out: []
                };
            }

            result.rows.forEach(row => {
                const bucketKey = `${row.bucket_index * resolutionHours}hr`;
                if (row.direction === 'in') {
                    buckets[bucketKey].in = row.transactions;
                } else {
                    buckets[bucketKey].out = row.transactions;
                }
            });

            return buckets;
        } catch (error) {
            console.error('Error fetching masp pool transactions:', error);
            throw error;
        }
    }
}

export const dbService = new DbService(); 