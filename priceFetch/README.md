# Backend API Server

**TODO: rename, since it does more than serve Coingecko price data now**

This backend server functions as a go-between/middleware for some data that would be difficult for the frontend to query otherwise, eg: abci queries to the Namada RPC, Coingecko price data, and data from the namada-indexer postgres db that doesn't yet have json endpoints.  

The frontend relies on the endpoints provided by this backend for roughly half of its data and expects it to be running in order to function correctly. In turn, this server relies on having access to a Namada **archive** RPC (or at least one configured to allow ~24 hrs worth of block look-behind), a Coingecko API key for price data, and a direct connection to a namada-indexer postgres db.

1. create a .env file by referring to .env.sample
2. start the server with `npm run start`
3. make it accessible to the frontend (eg: via nginx proxy)
