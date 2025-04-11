# Namada MASP Dashboard

This repo contains the front and backend code for the Namada Masp Dashboard (which can be seen live at https://masp.knowable.run).

Feel free to use or modify this code in any way you like.

Charts are made using [eCharts](https://echarts.apache.org/en/index.html).   

### Repo Contents:
- a frontend React app in `./namada-masp-dashboard`
- a small helper WASM module in Rust used by the backend server for decoding some Namada-SDK types from the ABCI responses; the source code for this is in `./src` and the prebuilt package is in `./pkg`
- a NodeJs express backend api server which caches and serves Coingecko price data as well as token supply, IBC 
and MASP metrics data from the Namada RPC and namada-indexer database; located in `./backend-api`

### Requirements
- a Namada RPC -- preferably an *archive node* -- and namada-indexer endpoint. The RPC should provide enough look-back 
to query ~30 days worth of blocks in the past
- If you want to use Coingecko price data, you will need an API key
- A local instance of `namada-indexer` (https://github.com/anoma/namada-indexer). A local instance is needed because the 
backend-api requires a direct connection to the indexer's postgres db
- Metadata (i.e. chain-registry) is used to get info about the canonical assets (such as their logo, symbol, etc.) and IBC channels. This repo uses the registry at https://github.com/vknowable/mock-registry though it could be subsituted with another

### Building the project
- You can find the prebuilt WASM package in `./pkg`; however if you wish to build it yourself, you can do so by first running `rustup target add wasm32-unknown-unknown` followed by `wasm-pack build --target web`. (This will recreate the contents of `./pkg`)
- To build the frontend, first install the dependencies: `cd namada-masp-dashboard` directory, followed by `npm install`. 
Then, create the file(s) `./namada-masp-dashboard/.env.development` and/or `./namada-masp-dashboard/.env.production` according to the example `.env.sample` (use the former when running `npm run dev` and the later when building with `npm run build`). Finally, run `npm run build` which will produce the `dist` directory containing your build

### Running the project
1. Make sure your RPC node and indexer are synced up and accesible to both the front and backends
2. Start the backend server in the `./backend-api` directory (`cd backend-api` and `npm run start`). The README inside that 
directory contains further info specific to running the backend. Make sure the backend api endpoint is accesible to the frontend
3. Enter the `namada-masp-dashboard` directory and create a .env file for the frontend (referring to `.env.sample`)
4. Start the frontend app, e.g. using `npm run dev` (or build it using `npm run build`)
