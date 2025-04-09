// Base token types
export type NativeToken = {
    address: string;
    type: "native";
};

export type IbcToken = {
    address: string;
    type: "ibc";
    trace: string;
};

export type Token = NativeToken | IbcToken;

// API Response types
export type TokensResponse = Token[];
export type AccountResponse = Balance[];
export type AggregatesResponse = FlowAggregate[];

// Balance information
export interface Balance {
    tokenAddress: string;
    minDenomAmount: string;
}

export interface ApiBalance {
    token: string;
    raw_amount: string;
}

// MASP aggregate data
export interface FlowAggregate {
    tokenAddress: string;
    timeWindow: string;
    kind: string;
    totalAmount: string;
}
