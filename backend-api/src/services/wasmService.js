import wasm from '../../../pkg/masp_dashboard_wasm.js'
class WasmService {
    constructor() {
        this.wasmModule = null;
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;

        try {
            // Initialize the WASM module
            this.wasmModule = wasm;
            this.initialized = true;
        } catch (error) {
            console.error('Failed to initialize WASM module:', error);
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
}

export const wasmService = new WasmService(); 