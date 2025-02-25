import { ChainMetadata } from "../types/chainRegistry"

type IbcTableProps = {
  registryData: ChainMetadata | undefined
  isLoading: boolean
  error: Error | null
}

function IbcTable({ registryData, isLoading = true, error = null }: IbcTableProps) {
  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error fetching Chain Registry data</div>

  return (
    <div>
      <ul className="list-disc mt-2 mx-8">
        {registryData?.ibcMetadata ?
          registryData.ibcMetadata.map(
            conn =>
              <li className="mb-8" key={conn.chain_1.client_id}>
                <ul className="mx-8">
                  <li>
                    <p><span className="font-bold">Chain A: </span>Registry name: {conn.chain_1.chain_name}/Chain id: {findChainIdByName(registryData, conn.chain_1.chain_name)}</p>
                    <p><span className="font-bold">Client/Connection: </span>{conn.chain_1.client_id}/{conn.chain_1.connection_id}</p>
                  </li>
                  <li>
                    <p><span className="font-bold">Chain B: </span>Registry name: {conn.chain_2.chain_name}/Chain id: {findChainIdByName(registryData, conn.chain_2.chain_name)}</p>
                    <p><span className="font-bold">Client/Connection: </span>{conn.chain_2.client_id}/{conn.chain_2.connection_id}</p>
                  </li>
                  <li>
                    <p><span className="font-bold">Channels:</span></p>
                    <ul className="mx-8">
                      {conn.channels.map(channel =>
                        <li key={channel.chain_1.channel_id}>
                          <p><span className="font-bold">{conn.chain_1.chain_name}: </span>{channel.chain_1.channel_id} {channel.chain_1.port_id}</p>
                          <p><span className="font-bold">{conn.chain_2.chain_name}: </span>{channel.chain_2.channel_id} {channel.chain_2.port_id}</p>
                        </li>
                      )}
                    </ul>
                  </li>
                </ul>
              </li>
          )
          : null
        }
      </ul>
    </div>
  )
}

function findChainIdByName(chainMetadata: ChainMetadata, chainName: string): string | undefined {
  // Check the main chain's `chain_name`
  if (chainMetadata.chain.chain_name === chainName) {
    return chainMetadata.chain.chain_id
  }

  // Check the `counterParties` array for matching `chain_name`
  const matchingCounterparty = chainMetadata.counterParties.find(
    cp => {
      try {
        return cp.chain.chain_name === chainName
      } catch {
        return ""
      }
    }
  )

  return matchingCounterparty?.chain.chain_id
}

export default IbcTable