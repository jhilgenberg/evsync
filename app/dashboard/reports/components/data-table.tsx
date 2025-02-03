"use client"

import { useState, useEffect, useCallback } from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  onRowSelectionChange: (selectedRows: string[]) => void
}

// Füge diese CSS-Klasse für ausgewählte Zeilen hinzu
const tableStyles = {
  selectedRow: "bg-muted/50"
}

export function DataTable<TData, TValue>({
  columns,
  data,
  onRowSelectionChange,
}: DataTableProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = useState({})

  const handleRowSelectionChange = useCallback((updater: any) => {
    let newSelection = {}
    if (typeof updater === 'function') {
      newSelection = updater(rowSelection)
    } else {
      newSelection = updater
    }
    setRowSelection(newSelection)
    
    const selectedRows = Object.keys(newSelection).map(
      (idx) => (data[parseInt(idx)] as any).id
    )
    onRowSelectionChange(selectedRows)
  }, [data, onRowSelectionChange, rowSelection])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    enableRowSelection: true,
    enableMultiRowSelection: true,
    state: {
      rowSelection,
    },
    onRowSelectionChange: handleRowSelectionChange,
  })

  // Reset selection only when data actually changes
  useEffect(() => {
    const hasSelection = Object.keys(rowSelection).length > 0
    if (hasSelection) {
      setRowSelection({})
    }
  }, [data])

  return (
    <div>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className={row.getIsSelected() ? tableStyles.selectedRow : undefined}
                data-state={row.getIsSelected() ? "selected" : undefined}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-24 text-center"
              >
                Keine Ergebnisse.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
} 