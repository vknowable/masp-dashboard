import apiClient from './apiClient'
import { ChainMetadata, IbcFileList, RegistryAssetList, RegistryChainJson, RegistryIbcMetadata } from '../types/chainRegistry'

const GITHUB_REPO = "vknowable/mock-registry"
const REPO_URL = `https://raw.githubusercontent.com/${GITHUB_REPO}/refs/heads/main`
const COSMOS_REGISTRY_REPO = "cosmos/chain-registry"
const COSMOS_REGISTRY_URL = `https://raw.githubusercontent.com/${COSMOS_REGISTRY_REPO}/refs/heads/master`

async function fetchRegistryJson<T>(url: string): Promise<T | null> {
  try {
    const { data } = await apiClient.get<T>(url)
    return data
  } catch (error) {
    console.error(`Error fetching Registry Json from: ${url}`, error instanceof Error ? error.message : 'Unknown error')
    return null
  }
}

async function fetchIbcFileList(url: string): Promise<IbcFileList> {
  try {
    const { data } = await apiClient.get<IbcFileList>(url)
    if (!Array.isArray(data)) {
      return getEmptyIbcFileList()
    }
    return data
  } catch (error) {
    console.error(`Error fetching Registry IBC files from: ${url}`, error instanceof Error ? error.message : 'Unknown error')
    return getEmptyIbcFileList()
  }
}

function getEmptyIbcFileList(): IbcFileList {
  return [{
    name: '',
    path: '',
    sha: '',
    size: 0,
    url: '',
    html_url: '',
    git_url: '',
    download_url: '',
    type: 'file',
    _links: {
      self: '',
      git: '',
      html: ''
    }
  }]
}

/// Fetch the chain registry data
export async function fetchChainMetadata(name: string, fetchIbc: boolean): Promise<ChainMetadata | null> {
  try {
    const [chainJson, assetListJson] = await Promise.all([
      fetchRegistryJson<RegistryChainJson>(`${REPO_URL}/${name}/chain.json`),
      fetchRegistryJson<RegistryAssetList>(`${REPO_URL}/${name}/assetlist.json`),
    ])

    if (!chainJson || !assetListJson) {
      throw new Error('Failed to fetch required chain metadata')
    }

    if (!fetchIbc) {
      return {
        chain: chainJson,
        assetList: assetListJson,
        ibcMetadata: [],
        counterParties: [],
      }
    }

    const chain_name = chainJson.chain_name
    const fileList = await fetchIbcFileList(`https://api.github.com/repos/${GITHUB_REPO}/contents/_IBC`)

    // filter the fileList for matches of the form {name}-{chainB}.json or {chainA}-{name}.json
    const matchingFiles = fileList.filter(file => {
      const fileName = file.name
      const regexFirst = new RegExp(`^(${chain_name})-(.*).json$`)
      const regexSecond = new RegExp(`^(.*)-(${chain_name}).json$`)
      return regexFirst.test(fileName) || regexSecond.test(fileName)
    })

    const ibcMetadata: RegistryIbcMetadata[] = []
    const counterParties: { chain: RegistryChainJson; assetList: RegistryAssetList }[] = []

    await Promise.all(
      matchingFiles.map(async (file) => {
        const [fileData, counterPartyChainName] = await Promise.all([
          fetchRegistryJson<RegistryIbcMetadata>(file.download_url),
          Promise.resolve((() => {
            const chains = file.name.replace(".json", "").split("-")
            return chains.filter(name => name !== chain_name)[0]
          })())
        ])

        if (fileData) {
          ibcMetadata.push(fileData)

          const [counterPartyChainJson, counterPartyAssetListJson] = await Promise.all([
            fetchRegistryJson<RegistryChainJson>(`${COSMOS_REGISTRY_URL}/${counterPartyChainName}/chain.json`),
            fetchRegistryJson<RegistryAssetList>(`${COSMOS_REGISTRY_URL}/${counterPartyChainName}/assetlist.json`),
          ])

          if (counterPartyChainJson && counterPartyAssetListJson) {
            counterParties.push({
              chain: counterPartyChainJson,
              assetList: counterPartyAssetListJson,
            })
          }
        }
      })
    )

    return {
      chain: chainJson,
      assetList: assetListJson,
      ibcMetadata,
      counterParties,
    }
  } catch (error) {
    console.error('Error fetching chain metadata:', error instanceof Error ? error.message : 'Unknown error')
    return null
  }
}