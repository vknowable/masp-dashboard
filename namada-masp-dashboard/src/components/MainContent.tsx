import IbcTable from "./IbcTable"
import MaspInfoDisplay from "./MaspInfoDisplay"
import TokenTable from "./TokenTable"
import { fetchMaspInfo, fetchTokens } from '../api/tokens'
import { fetchChainMetadata } from "../api/chainRegistry"
import { useQuery } from '@tanstack/react-query'
import { useState } from "react"
import RegistryJson from "./RegistryJson"
import PieChart from "./PieChart"
import BarChart from "./BarChart"

function MainContent() {
  const [hideNam, setHideNam] = useState<boolean>(false)

  const { data: maspInfo = undefined, isLoading: isLoadingMaspInfo, error: errorMaspInfo } = useQuery({
    queryKey: ['maspInfo'],
    queryFn: fetchMaspInfo,
    refetchInterval: 30000,
    staleTime: 300000,
  })

  const { data: registryData = undefined, isLoading: isLoadingRegistry, error: errorRegistry } = useQuery({
    queryKey: ['registryData'],
    queryFn: () => fetchChainMetadata("namada", true)
  })

  const { data: tokens = [], isLoading: isLoadingTokens, error: errorTokens } = useQuery({
    queryKey: ['tokens'],
    queryFn: () => fetchTokens(maspInfo?.rewardTokens ?? [], registryData?.assetList?.assets ?? []),
    refetchInterval: 30000,
    staleTime: 300000,
    enabled: !!maspInfo && !!registryData,
  })

  // check if there are no masp aggregates available; and if not, don't display empty charts
  const aggregatedTokens = tokens?.filter(token => token.aggregates.length !== 0)

  return (
    <div>
      <h2 className="text-lg font-semibold">General info:</h2>
      {
        aggregatedTokens.length > 0 ?
          <>
            <div className="flex flex-row justify-end items-center px-20 mb-4 w-full">
              <input id="hide-checkbox" type="checkbox" value="" onClick={() => setHideNam(state => !state)} className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded-sm focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" />
              <label htmlFor="hide-checkbox" className="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300">Hide NAM (if large NAM values are distorting the charts)</label>
            </div>

            <div className="flex flex-row items-end justify-around my-4">
              <PieChart tokenData={tokens} isLoading={isLoadingTokens} error={errorTokens} hideNam={hideNam} />
              <BarChart tokenData={tokens} isLoading={isLoadingTokens} error={errorTokens} hideNam={hideNam} />
            </div>
          </>
          : <></>
      }

      <MaspInfoDisplay maspInfo={maspInfo} assetList={registryData?.assetList} isLoading={isLoadingMaspInfo} error={errorMaspInfo} />

      <h2 className="text-lg font-semibold mt-4">Ibc channel info: </h2>from <a href="https://github.com/vknowable/mock-registry">https://github.com/vknowable/mock-registry</a>
      <IbcTable registryData={registryData} isLoading={isLoadingRegistry} error={errorRegistry} />

      <h2 className="text-lg font-semibold mt-4">All registry metadata: </h2>
      <RegistryJson registryData={registryData} isLoading={isLoadingRegistry} error={errorRegistry} />

      <h2 className="text-lg font-semibold mt-8">MASP metrics: (click column to sort)</h2>
      <p>Values are in denominated units (e.g. 10^-6)</p>
      <p className="italic text-sm text-gray-600 px-2">Powered by <a href="https://www.coingecko.com/en/api/" className="text-blue-600">CoinGecko API</a></p>

      <TokenTable tokenData={tokens} isLoading={isLoadingTokens} error={errorTokens} />
    </div>
  )
}

export default MainContent