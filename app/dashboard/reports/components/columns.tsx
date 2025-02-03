"use client"

import { ColumnDef } from "@tanstack/react-table"
import { formatInTimeZone } from 'date-fns-tz'
import { de } from 'date-fns/locale'
import { Zap } from 'lucide-react'

export type ChargingSession = {
  id: string
  start_time: string
  duration_minutes: number
  energy_kwh: number
  cost: number
  end_time?: string | null
  energy_rate?: number
}

export const columns: ColumnDef<ChargingSession>[] = [
  {
    accessorKey: "start_time",
    header: "Datum",
    cell: ({ row }) => formatInTimeZone(new Date(row.original.start_time), 'Europe/Berlin', 'Pp', { locale: de })
  },
  {
    accessorKey: "duration_minutes",
    header: "Dauer",
    cell: ({ row }) => {
      const duration = row.original.duration_minutes
      const hours = Math.floor(duration / 60)
      const minutes = duration % 60
      return `${hours > 0 ? `${hours}h ` : ''}${minutes}min`
    }
  },
  {
    accessorKey: "energy_kwh",
    header: "Energie",
    cell: ({ row }) => (
      <div className="flex items-center">
        <Zap className="mr-2 h-4 w-4 text-blue-500" />
        {Number(row.original.energy_kwh).toFixed(2)} kWh
      </div>
    )
  },
  {
    accessorKey: "cost",
    header: "Kosten",
    cell: ({ row }) => `${Number(row.original.cost).toFixed(2)} €`
  }
] 