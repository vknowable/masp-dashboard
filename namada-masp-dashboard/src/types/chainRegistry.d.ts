export type ChainMetadata = {
  chain: RegistryChainJson;
  assetList: RegistryAssetList;
  ibcMetadata: RegistryIbcMetadata[];
  counterParties: { chain: RegistryChainJson; assetList: RegistryAssetList }[];
};

export type RegistryChainJson = {
  $schema: string;
  chain_name: string;
  status: string;
  network_type: string;
  website: string;
  pretty_name: string;
  chain_type: string;
  chain_id: string;
  slip44: number;
  bech32_prefix: string;
  daemon_name: string;
  key_algos: string[];
  features: string[];
  fees: {
    fee_tokens: RegistryFeeToken[];
  };
  staking: {
    staking_tokens: RegistryStakingToken[];
    lock_duration: {
      time: string;
    };
  };
  codebase: {
    git_repo: string;
  };
  apis: {
    rpc: RegistryApiListing[];
    rest?: RegistryApiListing[];
  };
  explorers: RegistryExplorerListing[];
  logo_URIs: {
    svg: string;
  };
};

export type RegistryFeeToken = {
  denom: string;
  fixed_min_gas_price: number;
  low_gas_price: number;
  average_gas_price: number;
  high_gas_price: number;
};

export type RegistryStakingToken = {
  denom: string;
};

export type RegistryApiListing = {
  address: string;
  provider: string;
};

export type RegistryExplorerListing = {
  kind: string;
  url: string;
  tx_page: string;
};

export type RegistryAssetList = {
  $schema: string;
  chain_name: string;
  assets: RegistryAsset[];
};

export type RegistryAsset = {
  description: string;
  denom_units: RegistryAssetDenom[];
  type_asset: string;
  base: string;
  name: string;
  display: string;
  symbol: string;
  address: string;
  logo_URIs: {
    svg: string;
  };
  coingecko_id: string;
};

export type RegistryAssetDenom = {
  denom: string;
  exponent: number;
};

export type RegistryIbcMetadata = {
  $schema: string;
  chain_1: RegistryIbcConn;
  chain_2: RegistryIbcConn;
  channels: RegistryIbcChannel[];
};

export type RegistryIbcConn = {
  chain_name: string;
  client_id: string;
  connection_id: string;
};

export type RegistryIbcChannel = {
  chain_1: {
    channel_id: string;
    port_id: string;
  };
  chain_2: {
    channel_id: string;
    port_id: string;
  };
  ordering: string;
  version: string;
};

export type IbcFileList = [
  {
    name: string;
    path: string;
    sha: string;
    size: number;
    url: string;
    html_url: string;
    git_url: string;
    download_url: string;
    type: string;
    _links: {
      self: string;
      git: string;
      html: string;
    };
  },
];
