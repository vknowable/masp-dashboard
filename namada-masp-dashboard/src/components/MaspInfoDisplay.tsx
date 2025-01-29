import { RegistryAssetList } from "../types/chainRegistry"
import { MaspInfo } from "../types/masp"

type MaspInfoProps = {
  maspInfo: MaspInfo | undefined
  assetList: RegistryAssetList | undefined
  isLoading: boolean
  error: Error | null
}

function MaspInfoDisplay({ maspInfo, assetList, isLoading = true, error = null }: MaspInfoProps) {
  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error fetching MASP info</div>

  return (
    <div>
      <p>Epoch: <span className="font-bold">{maspInfo?.epoch ?? "not found"}</span></p>
      <p>MASP Epoch: <span className="font-bold">{maspInfo?.maspEpoch ?? "not found"}</span></p>
      <p>Total MASP rewards to date: <span className="font-bold">{maspInfo?.totalRewards ?? "not found"}</span> (uNAM)</p>
      <p>MASP Reward Tokens:</p>
      <p>(note: it's normal to see non-earning tokens appear in this list if their parameters have been explicitly set to 0, e.g. NAM.</p>
      <p>These could be filtered out by checking `max_reward_rate != 0`. This list is equivalent to the output of `namadac masp-reward-tokens`)</p>
      <ul className="list-disc mt-2 mx-8">
        {maspInfo?.rewardTokens ?
          maspInfo.rewardTokens.map(
            token =>
              <li key={token.address} className="mt-2">
                <p><span className="font-bold">token_map name: </span>{token.name}</p>
                <p>
                  <span className="font-bold">pretty name: </span>
                  {assetList?.assets.find(asset => asset.address === token.address)?.symbol ?? ""}
                  {assetList?.assets.find(asset => asset.address === token.address)?.logo_URIs && (
                    <img
                      src={assetList?.assets.find(asset => asset.address === token.address)?.logo_URIs.svg ?? ""}
                      alt={`${token.name} logo`}
                      className="inline-block ml-2 h-5 w-5"
                    />
                  )}
                </p>
                <p><span className="font-bold">address: </span>{token.address}</p>
                <p><span className="font-bold">locked amount target: </span>{token.locked_amount_target}</p>
                <p><span className="font-bold">max reward rate: </span>{token.max_reward_rate}</p>
                <p><span className="font-bold">kd gain: </span>{token.kd_gain}</p>
                <p><span className="font-bold">kp gain: </span>{token.kp_gain}</p>
              </li>
          )
          : null
        }
      </ul>
    </div>
  )
}

export default MaspInfoDisplay