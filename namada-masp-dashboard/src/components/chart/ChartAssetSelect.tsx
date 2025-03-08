import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchChainMetadata } from '../../api/chainRegistry'

function ChartAssetSelect() {
    const [isOpen, setIsOpen] = useState(false)
    const [selectedAsset, setSelectedAsset] = useState('All')

    const { data: registryData } = useQuery({
        queryKey: ['registryData'],
        queryFn: () => fetchChainMetadata("namada", true)
    })

    const assets = ['All', ...(registryData?.assetList?.assets?.map(asset => asset.symbol) || [])]

    return (
        <div className="min-h-full flex flex-col justify-start px-4 relative">
            <div className="text-base font-light text-xs mb-1">Select asset</div>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="bg-[#1E1E1E] text-white px-3 py-1 rounded border border-gray-700 min-w-[100px] text-left relative"
            >
                {selectedAsset}
                <span className="absolute right-2 top-1/2 transform -translate-y-1/2">▼</span>
            </button>
            {isOpen && (
                <div className="absolute top-full left-4 mt-1 w-[100px] bg-[#1E1E1E] border border-gray-700 rounded shadow-lg z-10 max-h-[200px] overflow-y-auto">
                    {assets.map((asset) => (
                        <div
                            key={asset}
                            className="px-3 py-1 hover:bg-gray-700 cursor-pointer"
                            onClick={() => {
                                setSelectedAsset(asset)
                                setIsOpen(false)
                            }}
                        >
                            {asset}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default ChartAssetSelect