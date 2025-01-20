export type AbciQueryResponse = {
  jsonrpc: string
  id: number
  result: AbciQueryResult
}

export type AbciQueryResult = {
  response: {
    code: number
    log: string
    info: string
    index: number
    key?: string
    value?: string
    proofOps?: string,
    height: number,
    codespace: string
  }
}