# Namada MASP Dashboard demo

This demo shows some MASP and IBC info that can be gathered using ABCI queries, namada-indexer, and chain-registry metadata.  

Feel free to use or modify this code in any way you like.

Charts are made using [eCharts](https://echarts.apache.org/en/index.html).  

There are two components:
- the React app (in `./namada-masp-dashboard`)
- a small helper WASM module in Rust for decoding some Namada-SDK types from the ABCI responses (in `./src`)

### Building the project
1. Build the wasm with `wasm-pack build --target web` which will create the package at `./pkg`
2. Add this package as a project dependency (if not already added): from the `./namada-masp-dashboard` directory, run `npm install ../pkg`
3. Install the remaining web-app dependencies: from the `./namada-masp-dashboard` directory, run `npm install`
4. Update the environment variables in `./namada-masp-dashboard/.env.development` and/or `./namada-masp-dashboard/.env.production` with your RPC and namada-indexer endpoints
5. Run the app, e.g. using `npm run dev` (or build it using `npm run build`)

### Requirements
- You'll need an RPC and namada-indexer endpoint
- For the charts, you'll need to use a commit of namada-indexer that includes the `masp/aggregates` endpoint (as of 02/04/20205: Checkout the branch `fraccaman/masp`)
- Metadata (i.e. chain-registry) is used to get info about the canonical assets (such as their logo, symbol, etc.) and IBC channels. This demo uses a mock registry at https://github.com/vknowable/mock-registry. For mainnet or public testnets, you could take the same approach referencing  something like https://github.com/anoma/namada-chain-registry or a repo you maintain
