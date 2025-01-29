import apiClient from './apiClient'
import { ChainMetadata, IbcFileList, RegistryAssetList, RegistryChainJson, RegistryIbcMetadata } from '../types/chainRegistry'

const GITHUB_REPO = "vknowable/mock-registry"
const REPO_URL = `https://raw.githubusercontent.com/${GITHUB_REPO}/refs/heads/main`

const fetchRegistyJson = async (url: string): Promise<RegistryChainJson | RegistryAssetList | RegistryIbcMetadata | null> => {
  try {
    const { data }: { data: RegistryChainJson | RegistryAssetList | RegistryIbcMetadata } = await apiClient.get(url)
    return data
  } catch (error) {
    console.error(`Error fetching Registry Json from: ${url}`, error)
    return null
  }
}

const fetchIbcFileList = async (url: string): Promise<IbcFileList | null> => {
  try {
    const { data }: { data: IbcFileList } = await apiClient.get(url)
    return data
  } catch (error) {
    console.error(`Error fetching Registry IBC files from: ${url}`, error)
    return null
  }
}

/// Fetch the chain registry data
export const fetchChainMetadata = async (name: string, fetchIbc: boolean): Promise<ChainMetadata> => {
  const [chainJson, assetListJson] = await Promise.all([
    fetchRegistyJson(`${REPO_URL}/${name}/chain.json`),
    fetchRegistyJson(`${REPO_URL}/${name}/assetlist.json`),
  ])

  let ibcMetadata: RegistryIbcMetadata[] = []
  let counterParties: { chain: RegistryChainJson, assetList: RegistryAssetList }[] = []

  if (fetchIbc) {
    const chain_name = (chainJson as RegistryChainJson).chain_name
    const fileListResult = await fetchIbcFileList(`https://api.github.com/repos/${GITHUB_REPO}/contents/_IBC`)
    const fileList = fileListResult ? fileListResult : []

    // filter the fileList for matches of the form {name}-{chainB}.json or {chainA}-{name}.json
    const matchingFiles = fileList.filter(file => {
      const fileName = file.name
      const regexFirst = new RegExp(`^(${chain_name})-(.*).json$`)
      const regexSecond = new RegExp(`^(.*)-(${chain_name}).json$`)
      return regexFirst.test(fileName) || regexSecond.test(fileName)
    })

    for (const file of matchingFiles) {
      const fileData = await fetchRegistyJson(file.download_url)
      ibcMetadata.push(fileData as RegistryIbcMetadata)

      // extract the counterparty chain name from the filename
      const counterPartyChainName = (() => {
        const chains = file.name.replace(".json", "").split("-")
        return chains.filter(name => name !== chain_name)[0]
      })()

      // fetch chain.json and assetlist.json for the counterparty chain
      // we don't really need this data for this app, it's just provided here as an example
      const [counterPartyChainJson, counterPartyAssetListJson] = await Promise.all([
        fetchRegistyJson(`${REPO_URL}/${counterPartyChainName}/chain.json`),
        fetchRegistyJson(`${REPO_URL}/${counterPartyChainName}/assetlist.json`),
      ])

      // Push the counterparty chain and asset list to the counterParties array
      counterParties.push({
        chain: counterPartyChainJson as RegistryChainJson,
        assetList: counterPartyAssetListJson as RegistryAssetList,
      })
    }
  }

  return {
    chain: chainJson as RegistryChainJson,
    assetList: assetListJson as RegistryAssetList,
    ibcMetadata,
    counterParties,
  }
}