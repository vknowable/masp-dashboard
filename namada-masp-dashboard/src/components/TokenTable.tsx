import { useMemo, useState } from 'react'
import {
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { useTokenDisplay } from '../hooks/useTokenDisplay'
import { TokenDisplayRow } from '../types/token'
import { ChainMetadata } from '../types/chainRegistry'

interface TokenTableProps {
  chainData: ChainMetadata | null | undefined
}

export default function TokenTable({ chainData }: TokenTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const { tokenRows, isLoading, error } = useTokenDisplay({ chainData })

  const columns = useMemo<ColumnDef<TokenDisplayRow>[]>(
    () => [
      {
        accessorKey: 'logo',
        header: 'Logo',
        cell: ({ row }) => {
          const logoUrl = row.original.logoUrl
          return logoUrl ? (
            <img 
              src={logoUrl} 
              alt={`${row.original.symbol} logo`} 
              className="w-8 h-8"
            />
          ) : null
        },
      },
      { 
        accessorKey: 'symbol', 
        header: 'Symbol',
      },
      { 
        accessorKey: 'address', 
        header: 'Address',
      },
      {
        accessorKey: 'totalShielded',
        header: 'Total Shielded',
        cell: ({ row }) => {
          const value = row.original.totalShielded
          const symbol = row.original.symbol
          return `${value} ${symbol}`
        }
      },
      {
        accessorKey: 'currentShielded',
        header: 'Current Shielded',
        cell: ({ row }) => {
          const value = row.original.currentShielded
          const symbol = row.original.symbol
          return `${value} ${symbol}`
        }
      },
      {
        accessorKey: 'usdPrice',
        header: 'Price (USD)',
        cell: ({ row }) => {
          const price = row.original.usdPrice
          return price !== null ? `$${price.toFixed(2)}` : 'N/A'
        }
      },
      {
        accessorKey: 'rewardsParam',
        header: 'Rewards Parameter',
      },
      {
        id: 'percentageChanges',
        header: 'Changes',
        cell: ({ row }) => {
          const changes = row.original.percentageChanges
          return (
            <div className="flex gap-2">
              <span className={changes['24h'] >= 0 ? 'text-green-500' : 'text-red-500'}>
                {changes['24h'].toFixed(2)}% (24h)
              </span>
              <span className={changes['7d'] >= 0 ? 'text-green-500' : 'text-red-500'}>
                {changes['7d'].toFixed(2)}% (7d)
              </span>
              <span className={changes['30d'] >= 0 ? 'text-green-500' : 'text-red-500'}>
                {changes['30d'].toFixed(2)}% (30d)
              </span>
            </div>
          )
        }
      }
    ],
    []
  )

  const table = useReactTable({
    data: tokenRows,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-700 rounded mb-4" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-700 rounded mb-2" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-red-400 bg-red-900/20 rounded-lg p-4">
        Error loading token data: {error.message}
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-700">
        <thead>
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <th
                  key={header.id}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                >
                  {header.isPlaceholder ? null : (
                    <div
                      className={header.column.getCanSort() ? 'cursor-pointer select-none' : ''}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {{
                        asc: ' 🔼',
                        desc: ' 🔽',
                      }[header.column.getIsSorted() as string] ?? null}
                    </div>
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y divide-gray-700">
          {table.getRowModel().rows.map(row => (
            <tr key={row.id}>
              {row.getVisibleCells().map(cell => (
                <td
                  key={cell.id}
                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-200"
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}