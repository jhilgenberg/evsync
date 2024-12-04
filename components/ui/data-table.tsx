'use client'

import React, { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { 
  ChevronLeft, 
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface DataTableProps<T> {
  columns: {
    accessorKey: Extract<keyof T, string | number>
    header: string
    cell?: (value: T[Extract<keyof T, string | number>]) => React.ReactNode
  }[]
  data: T[]
  pagination?: {
    pageSize?: number
    className?: string
  }
  className?: string
}

export function DataTable<T>({ 
  columns, 
  data,
  pagination = { pageSize: 10 },
  className
}: DataTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = pagination.pageSize || 10
  const totalPages = Math.ceil(data.length / pageSize)

  const paginatedData = data.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  const renderCellContent = (value: T[Extract<keyof T, string | number>]): React.ReactNode => {
    if (React.isValidElement(value)) {
      return value
    }
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return value.toString()
    }
    // Fallback für andere Typen
    return String(value)
  }

  return (
    <div className={className}>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={String(column.accessorKey)}>
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((row, i) => (
              <TableRow key={i}>
                {columns.map((column) => (
                  <TableCell key={String(column.accessorKey)}>
                    {column.cell 
                      ? column.cell(row[column.accessorKey])
                      : renderCellContent(row[column.accessorKey])
                    }
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className={cn(
          "flex items-center justify-end space-x-2 py-4",
          pagination.className
        )}>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            Seite {currentPage} von {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
} 