import IbcTable from "./IbcTable"
import MaspInfoDisplay from "./MaspInfoDisplay"
import TokenTable from "./TokenTable"
import { fetchMaspInfo } from '../api/tokens'
import { fetchChainMetadata } from "../api/chainRegistry"
import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from "react"
import RegistryJson from "./RegistryJson"

function MainContent() {
  const { data: maspInfo = undefined, isLoading: isLoadingMaspInfo, error: errorMaspInfo } = useQuery({
    queryKey: ['maspInfo'],
    queryFn: fetchMaspInfo,
    refetchInterval: 10000,
    staleTime: 300000,
  })

  const { data: registryData = undefined, isLoading: isLoadingRegistry, error: errorRegistry } = useQuery({
    queryKey: ['registryData'],
    queryFn: () => fetchChainMetadata("namada", true)
  })

  return (
    <div>
      <h2 className="text-lg font-semibold">General info:</h2>
      <MaspInfoDisplay maspInfo={maspInfo} assetList={registryData?.assetList} isLoading={isLoadingMaspInfo} error={errorMaspInfo} />

      <h2 className="text-lg font-semibold mt-4">Ibc channel info: </h2>from <a href="https://github.com/vknowable/mock-registry">https://github.com/vknowable/mock-registry</a>
      <IbcTable registryData={registryData} isLoading={isLoadingRegistry} error={errorRegistry} />

      <h2 className="text-lg font-semibold mt-4">All registry metadata: </h2>
      <RegistryJson registryData={registryData} isLoading={isLoadingRegistry} error={errorRegistry} />

      <h2 className="text-lg font-semibold mt-8">MASP metrics: (click column to sort)</h2>
      <p>Values are in denominated units (e.g. 10^-6)</p>

      <TokenTable rewardTokens={maspInfo?.rewardTokens} assetList={registryData?.assetList} />
    </div>
  )
}

export default MainContent