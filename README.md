# Namada MASP Dashboard demo

This demo shows some MASP and IBC info that can be gathered using ABCI queries, namada-indexer, and chain-registry metadata.  

Feel free to use or modify this code in any way you like.

Charts are made using [eCharts](https://echarts.apache.org/en/index.html).  

There are three components:
- the React app (in `./namada-masp-dashboard`)
- a small helper WASM module in Rust for decoding some Namada-SDK types from the ABCI responses (in `./src`)
- a nodejs express backend for serving price data and info related to token supplies, etc

### Building the project
1. Build the wasm with `wasm-pack build --target web` which will create the package at `./pkg`
2. Add this package as a project dependency (if not already added): from the `./namada-masp-dashboard` directory, run `npm install ../pkg`
3. Install the remaining web-app dependencies: from the `./namada-masp-dashboard` directory, run `npm install`
4. Create the files `./namada-masp-dashboard/.env.development` and/or `./namada-masp-dashboard/.env.production` with your endpoint URLs according to the example `.env.sample` (use the former when running `npm run dev` and the later when building with `npm run build`)
5. Start the backend server in the `priceFetch` directory (`npm run start`). If you intend to use Coingecko price data, you will need to obtain a Coingecko API key; see the README in that folder for further details.
6. Run the app, e.g. using `npm run dev` (or build it using `npm run build`)

### Requirements
- You'll need an RPC -- preferably an *archive node* -- and namada-indexer endpoint. The RPC should provide enough look-back 
to query 24 hrs worth of blocks in the past
- If you want to use Coingecko price data, you will need an API key
- For the charts, you'll need to use a commit of namada-indexer that includes the `masp/aggregates` endpoint (as of 03/17/2025: the `main` branch has the necessary endpoint but not the latest tagged release)
- Metadata (i.e. chain-registry) is used to get info about the canonical assets (such as their logo, symbol, etc.) and IBC channels. This demo uses a mock registry at https://github.com/vknowable/mock-registry. For mainnet or public testnets, you could take the same approach referencing  something like https://github.com/anoma/namada-chain-registry or a repo you maintain
