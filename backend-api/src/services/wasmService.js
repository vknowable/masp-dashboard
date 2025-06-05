import wasm from '../../../pkg/masp_dashboard_wasm.js'
import { getSdk, sdkInit } from './namadaSdk.cjs';
import { config } from "../config.js";
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class WasmService {
    constructor() {
        this.wasmModule = null;
        this.namadaSdk = null;
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;

        try {
            // Initialize the masp-dashboard WASM module
            this.wasmModule = wasm;

            // Initialize Namada SDK
            const { cryptoMemory } = sdkInit();
            console.log('namadaRpcUrl', config.namadaRpcUrl);
            console.log('namTokenAddress', config.namTokenAddress);
            console.log('namadaChainId', config.chainId);
            console.log('maspIndexerUrl', config.maspIndexerUrl);

            const dataDir = config.dataDir;

            const requiredFiles = ['shielded.dat', 'shielded_sync.cache', 'speculative_shielded.dat'];
            for (const fileName of requiredFiles) {
                const filePath = path.join(dataDir, fileName);
                try {
                    await fs.promises.access(filePath);
                    // console.log(`${fileName} exists.`);
                } catch (error) {
                    // File does not exist, create it
                    // console.log(`${fileName} does not exist, creating...`);
                    await fs.promises.writeFile(filePath, '');
                    // console.log(`${fileName} created.`);
                }
            }

            // Initialize SDK with proper storage path
            this.namadaSdk = getSdk(
                cryptoMemory,
                config.namadaRpcUrl,
                config.maspIndexerUrl,
                dataDir,
                config.namTokenAddress
            );

            this.initialized = true;
            console.log('WASM modules initialized successfully');
        } catch (error) {
            console.error('Failed to initialize WASM modules:', error);
            throw error;
        }
    }

    decodeAbciAmount(value) {
        if (!this.initialized) {
            throw new Error('WASM module not initialized');
        }

        try {
            return this.wasmModule.decode_amount(value);
        } catch (error) {
            console.error('Failed to decode ABCI value:', error);
            return null;
        }
    }

    decodeAbciRewardTokens(value) {
        if (!this.initialized) {
            throw new Error('WASM module not initialized');
        }

        try {
            return this.wasmModule.decode_reward_tokens(value);
        } catch (error) {
            console.error('Failed to decode ABCI value:', error);
            return null;
        }
    }

    decodeAbciMaspEpoch(value) {
        if (!this.initialized) {
            throw new Error('WASM module not initialized');
        }

        try {
            return this.wasmModule.decode_epoch(value);
        } catch (error) {
            console.error('Failed to decode ABCI value:', error);
            return null;
        }
    }

    decodeAbciPosParams(value) {
        if (!this.initialized) {
            throw new Error('WASM module not initialized');
        }

        try {
            return this.wasmModule.decode_pos_params(value);
        } catch (error) {
            console.error('Failed to decode ABCI value:', error);
            return null;
        }
    }

    // Add new methods for Namada SDK functionality
    getNamadaSdk() {
        if (!this.initialized) {
            throw new Error('WASM modules not initialized');
        }
        return this.namadaSdk;
    }
}

export const wasmService = new WasmService(); 