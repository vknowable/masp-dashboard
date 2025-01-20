# Namada MASP Dashboard demo

This project has two components:
- the React app (in `./namada-masp-dashboard`)
- a WASM module in Rust for decoding some Namada-SDK types from the ABCI responses (in `./src`)

### Building the project
1. Build the wasm with `wasm-pack build --target web` which will create the package at `./pkg`
2. Add as a dependency (if not already added) -- from the `./namada-masp-dashboard` directory, run `npm install ../pkg`
3. Install the remaining web-app dependencies -- from the `./namada-masp-dashboard` directory, run `npm install`
4. Update the environment variables in `./namada-masp-dashboard/.env.development` with your RPC and namada-indexer endpoints
5. Run the app, e.g. using `npm run dev`

### Requirements
- You'll need an RPC and namada-indexer endpoint
- Metadata (i.e. chain-registry) is used to get info about the canonical assets (such as their logo, symbol, etc.). This demo uses a mock registry at https://github.com/vknowable/mock-registry. For mainnet or public testnets, you should update the URLs to point to something like https://github.com/anoma/namada-chain-registry or a repo you maintain
