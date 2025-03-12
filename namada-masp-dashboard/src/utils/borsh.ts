import { decode_amount } from 'masp_dashboard_wasm'

// Helper functions to decode Borsh-encoded values from the abci query response

// Decode a base64 string directly
export function decodeBorshAmtStr(value: string | null): number | null {
    if (!value) return null

    try {
        return decode_amount(value)
    } catch (error) {
        console.error("Error decoding abci borsh amount:", error instanceof Error ? error.message : 'Unknown error')
        return null
    }
}