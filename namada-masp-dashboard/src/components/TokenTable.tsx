import { useState, useMemo } from 'react'
import { useReactTable, getCoreRowModel, getSortedRowModel, SortingState, ColumnDef, flexRender } from '@tanstack/react-table'
import { TokenDisplayRow } from '../types/token'
import { useQuery } from '@tanstack/react-query'
import { fetchTokens } from '../api/tokens'
import { RewardToken } from '../types/masp'
import { RegistryAssetList } from '../types/chainRegistry'

type TokenTableProps = {
  rewardTokens?: RewardToken[]
  assetList?: RegistryAssetList
}

function TokenTable({ rewardTokens, assetList }: TokenTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])

  const { data: tokens = [], isLoading, error } = useQuery({
    queryKey: ['tokens', rewardTokens],
    queryFn: () => fetchTokens(rewardTokens ?? [], assetList?.assets ?? []),
    refetchInterval: 10000,
    staleTime: 300000,
  })

  const columns = useMemo<ColumnDef<TokenDisplayRow>[]>(
    () => [
      { accessorKey: 'ssrEligible', header: 'SSR Eligible', },
      {
        accessorKey: 'logo',
        header: 'Logo',
        cell: ({ getValue }) => {
          const logoUrl = getValue() as string
          return logoUrl ? <img src={logoUrl} alt="Logo" style={{ width: '32px', height: '32px' }} /> : null
        },
      },
      { accessorKey: 'name', header: 'Symbol', },
      { accessorKey: 'address', header: 'Address', },
      { accessorKey: 'trace', header: 'Trace', },
      { accessorKey: 'exponent', header: 'Exponent', },
      { accessorKey: 'volume', header: 'Net IBC deposit This Epoch', },
      { accessorKey: 'totalAmount', header: 'Total tokens on chain', },
      { accessorKey: 'usdPrice', header: 'Price ($) (using placeholder 0.05/Token)', },
      { accessorKey: 'maspAmount', header: 'Tokens in MASP', },
      { accessorKey: 'maspMarketCap', header: 'MASP TVL ($)', },
      { accessorKey: 'ssrRateLast', header: 'Last epoch Rewards Rate (NAM minted / token)', },
      { accessorKey: 'estRateCur', header: 'Expected Rewards Rate (this epoch) (NAM minted / token)', },
      { accessorKey: 'ssrRewardsLast', header: 'NAM Rewards (last epoch)', },
      { accessorKey: 'estRewardsCur', header: 'Expected Nam Rewards (this epoch)', },
      { accessorKey: 'usdRewards', header: 'Expected Rewards ($) (this epoch)', },
    ],
    []
  )

  const table = useReactTable({
    columns,
    data: tokens,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: { sorting },

  })

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error fetching tokens</div>

  return (
    <div className='p-2'>
      <div className='h-2'>
        <table className="border-separate border border-slate-400">
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => {
                  return (
                    <th key={header.id} colSpan={header.colSpan} className='min-w-28'>
                      {header.isPlaceholder ? null : (
                        <div
                          className={
                            header.column.getCanSort()
                              ? 'cursor-pointer select-none'
                              : ''
                          }
                          onClick={header.column.getToggleSortingHandler()}
                          title={
                            header.column.getCanSort()
                              ? header.column.getNextSortingOrder() === 'asc'
                                ? 'Sort ascending'
                                : header.column.getNextSortingOrder() === 'desc'
                                  ? 'Sort descending'
                                  : 'Clear sort'
                              : undefined
                          }
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {header.column.getCanSort() && (
                            {
                              asc: ' 🔼',
                              desc: ' 🔽',
                            }[header.column.getIsSorted() as string] ?? ' 📶'
                          )}
                        </div>
                      )}
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table
              .getRowModel()
              .rows.slice(0, 10)
              .map(row => {
                return (
                  <tr key={row.id} className={row.original.ssrEligible ? "bg-green-300" : ""}>
                    {row.getVisibleCells().map(cell => {
                      return (
                        <td key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default TokenTable