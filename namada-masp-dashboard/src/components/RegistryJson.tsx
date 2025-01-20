import { useState } from "react"
import { ChainMetadata } from "../types/chainRegistry"

type RegistryJsonProps = {
  registryData: ChainMetadata | undefined
  isLoading: boolean
  error: Error | null
}

function RegistryJson({ registryData, isLoading = true, error = null }: RegistryJsonProps) {
  const [hidden, setHidden] = useState<boolean>(true)
  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error fetching Chain Registry data</div>

  return (
    <div>
      <button className="bg-blue-300 text-black rounded-md p-2" onClick={() => { setHidden(hidden => !hidden) }}>Show/Hide</button>
      {!hidden ?
        <div>
          <pre>{JSON.stringify(registryData, null, 2)}</pre>
          <button className="bg-blue-300 text-black rounded-md p-2" onClick={() => { setHidden(hidden => !hidden) }}>Collapse</button>
        </div>
        : null
      }
    </div>
  )
}

export default RegistryJson