"use client"

import { ColumnDef } from "@tanstack/react-table"
import { formatInTimeZone } from 'date-fns-tz'
import { de } from 'date-fns/locale'
import { Zap } from 'lucide-react'
import { Car } from '@/types/wallbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'

export type ChargingSession = {
  id: string
  wallbox_id: string
  user_id: string
  session_id: string
  start_time: string
  end_time: string
  energy_kwh: number
  cost: number
  tariff_id?: string
  tariff_name?: string
  energy_rate?: number
  car_id?: string | null
  raw_data?: Record<string, unknown>
}

export const createColumns = (
  cars: Car[],
  onAssignCar: (ids: string[], car_id: string) => void
): ColumnDef<ChargingSession>[] => [
  {
    id: "select",
    enableSorting: false,
    enableHiding: false,
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Alle auswählen"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Zeile auswählen"
      />
    ),
  },
  {
    accessorKey: "start_time",
    header: "Datum",
    cell: ({ row }) => {
      const date = new Date(row.original.start_time)
      return formatInTimeZone(date, 'Europe/Berlin', 'Pp', { locale: de })
    }
  },
  {
    accessorKey: "duration_minutes",
    header: "Dauer",
    cell: ({ row }) => {
      const start = new Date(row.original.start_time)
      const end = new Date(row.original.end_time)
      const durationMinutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60))
      const hours = Math.floor(durationMinutes / 60)
      const minutes = durationMinutes % 60
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
  },
  {
    accessorKey: "car_id",
    header: "Auto",
    cell: ({ row }) => {
      const session = row.original
      return (
        <Select
          value={session.car_id || ''}
          onValueChange={(value) => onAssignCar([session.id], value)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue>
              {cars.find(c => c.id === session.car_id)
                ? `${cars.find(c => c.id === session.car_id)?.make} ${cars.find(c => c.id === session.car_id)?.model}`
                : 'Auto auswählen'
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {cars.map(car => (
              <SelectItem key={car.id} value={car.id}>
                {car.make} {car.model}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    }
  },
] 