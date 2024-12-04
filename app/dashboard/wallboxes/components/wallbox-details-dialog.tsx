'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { WallboxConnection, type PhaseInfo } from '@/types/wallbox'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface WallboxStatus {
  isOnline: boolean
  carState: string
  currentPower: number
  totalEnergy: number
  temperature: number
  firmware: string
  wifiConnected: boolean
  details: {
    power: {
      totalPower: number
      phases: {
        [key: string]: {
          voltage: number
          current: number
          power: number
          powerFactor: number
        }
      }
    }
  }
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  connection: WallboxConnection
  status: WallboxStatus | undefined
}

function PhaseInfo({ phase, label }: { phase: PhaseInfo; label: string }) {
  if (!phase) return null

  return (
    <div className="space-y-1">
      <h4 className="font-medium">{label}</h4>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-muted-foreground">Spannung:</span>
          <span className="ml-2">{phase.voltage.toFixed(1)} V</span>
        </div>
        <div>
          <span className="text-muted-foreground">Strom:</span>
          <span className="ml-2">{phase.current.toFixed(1)} A</span>
        </div>
        <div>
          <span className="text-muted-foreground">Leistung:</span>
          <span className="ml-2">{phase.power.toFixed(2)} kW</span>
        </div>
        {phase.powerFactor > 0 && (
          <div>
            <span className="text-muted-foreground">Leistungsfaktor:</span>
            <span className="ml-2">{phase.powerFactor}%</span>
          </div>
        )}
      </div>
    </div>
  )
}

export function WallboxDetailsDialog({ 
  open, 
  onOpenChange, 
  connection, 
  status 
}: Props) {
  if (!status) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{connection.name}</DialogTitle>
        </DialogHeader>

        {/* Status-Karten mit allen wichtigen Informationen */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                <div className="flex items-center">
                  <div className={cn(
                    "h-2 w-2 rounded-full mr-2",
                    status?.isOnline ? "bg-green-500" : "bg-red-500"
                  )} />
                  <span className="font-medium">
                    {status?.isOnline ? "Online" : "Offline"}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {status?.carState || 'Unbekannt'}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Aktuelle Leistung</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {status?.currentPower.toFixed(2)} kW
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Gesamtenergie</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {status?.totalEnergy.toFixed(2)} kWh
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Temperatur</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {status?.temperature}°C
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Phasen-Informationen mit scrollbarer Tabelle */}
        <div className="space-y-4 mt-4">
          <h3 className="font-medium">Phasen-Details</h3>
          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full min-w-[400px]">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium">Phase</th>
                  <th className="text-right py-2 font-medium">Spannung</th>
                  <th className="text-right py-2 font-medium">Strom</th>
                  <th className="text-right py-2 font-medium">Leistung</th>
                  <th className="text-right py-2 font-medium">Leistungsfaktor</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(status?.details.power.phases || {}).map(([phase, info]) => (
                  <tr key={phase} className="border-b">
                    <td className="py-2">{phase.toUpperCase()}</td>
                    <td className="text-right py-2">{info.voltage.toFixed(1)} V</td>
                    <td className="text-right py-2">{info.current.toFixed(1)} A</td>
                    <td className="text-right py-2">{info.power.toFixed(2)} kW</td>
                    <td className="text-right py-2">{info.powerFactor}%</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="font-medium">
                  <td className="py-2">Gesamt</td>
                  <td className="text-right py-2">-</td>
                  <td className="text-right py-2">-</td>
                  <td className="text-right py-2">{status?.details.power.totalPower.toFixed(2)} kW</td>
                  <td className="text-right py-2">-</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Verbindungs-Details */}
        <div className="space-y-4 mt-4">
          <h3 className="font-medium">Verbindungs-Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex flex-col sm:flex-row sm:justify-between py-2 border-b">
              <span className="text-muted-foreground">Firmware</span>
              <span className="font-medium">{status?.firmware}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between py-2 border-b">
              <span className="text-muted-foreground">WLAN Status</span>
              <span className="font-medium">
                {status?.wifiConnected ? "Verbunden" : "Nicht verbunden"}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between py-2 border-b">
              <span className="text-muted-foreground">Letzte Aktualisierung</span>
              <span className="font-medium">
                {format(new Date(), 'PPp', { locale: de })}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Schließen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 