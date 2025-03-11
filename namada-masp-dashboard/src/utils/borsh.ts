import { AbciQueryResponse } from "../types/abci"
import { decode_amount } from 'masp_dashboard_wasm'

// Helper functions to decode Borsh-encoded amounts
// Decode a Borsh-encoded amount from an AbciQueryResponse
export function decodeBorshAmt(response: AbciQueryResponse | null): number {
    const base64 = response?.result?.response?.value
    if (!base64) {
        return 0
    }

    try {
        return decode_amount(base64)
    } catch (error) {
        console.error("Error decoding abci borsh amount:", error instanceof Error ? error.message : 'Unknown error')
        return 0
    }
}

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