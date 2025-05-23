import dotenv from "dotenv";

dotenv.config();

export const config = {
    refreshSecs: process.env.REFRESH_SECS || 300,
    requestLimit: process.env.REQUEST_LIMIT || 100,
    servePort: process.env.SERVE_PORT || 5337,
    coingeckoApiKey: process.env.COINGECKO_API_KEY,
    assetListUrl: process.env.ASSET_LIST_URL,
    maxRetries: 3,
    initialRetryDelay: 10000, // 10 seconds
    rateLimitWindow: 60 * 1000, // 1 minute
    coingeckoBaseUrl: "https://api.coingecko.com/api/v3",
    namadaRpcUrl: process.env.NAMADA_RPC_URL,
    namTokenAddress: process.env.NAM_TOKEN_ADDRESS,
    // Database configuration
    dbUser: process.env.DB_USER,
    dbHost: process.env.DB_HOST,
    dbName: process.env.DB_NAME,
    dbPassword: process.env.DB_PASSWORD,
    dbPort: process.env.DB_PORT || 5432,
    dbMockMode: process.env.DB_MOCK_MODE === 'true',
}; 