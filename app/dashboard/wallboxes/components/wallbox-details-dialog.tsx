'use client'

import { useState, useEffect, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
import { WallboxConnection, WallboxStatus, type PhaseInfo } from '@/types/wallbox'
import { Battery, Zap, ThermometerSun, RefreshCw, Power } from 'lucide-react'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  connection: WallboxConnection
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

export function WallboxDetailsDialog({ open, onOpenChange, connection }: Props) {
  const [status, setStatus] = useState<WallboxStatus | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/wallboxes/${connection.id}/status`)
      if (!response.ok) throw new Error('Fehler beim Laden des Status')
      const data: WallboxStatus = await response.json()
      setStatus(data)
    } catch (error) {
      console.error('Status Fehler:', error)
    } finally {
      setLoading(false)
    }
  }, [connection.id])

  useEffect(() => {
    if (open) {
      fetchStatus()
      const interval = setInterval(fetchStatus, 5000)
      return () => clearInterval(interval)
    }
  }, [open, fetchStatus])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{connection.name}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Status-Karten */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center">
                    <Power className="h-5 w-5 mb-2 text-blue-500" />
                    <div className="text-sm font-medium">Status</div>
                    <div className="text-2xl font-bold">
                      {status?.carState || 'Unbekannt'}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center">
                    <Zap className="h-5 w-5 mb-2 text-yellow-500" />
                    <div className="text-sm font-medium">Leistung</div>
                    <div className="text-2xl font-bold">
                      {status?.currentPower.toFixed(2)} kW
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center">
                    <Battery className="h-5 w-5 mb-2 text-green-500" />
                    <div className="text-sm font-medium">Geladen</div>
                    <div className="text-2xl font-bold">
                      {status?.totalEnergy.toFixed(2)} kWh
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center">
                    <ThermometerSun className="h-5 w-5 mb-2 text-orange-500" />
                    <div className="text-sm font-medium">Temperatur</div>
                    <div className="text-2xl font-bold">
                      {status?.temperature}°C
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Phasen-Details */}
            {status?.details.power && (
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-medium mb-4">Phasen-Details</h3>
                  <div className="space-y-6">
                    <PhaseInfo phase={status.details.power.phases.l1} label="Phase L1" />
                    <PhaseInfo phase={status.details.power.phases.l2} label="Phase L2" />
                    <PhaseInfo phase={status.details.power.phases.l3} label="Phase L3" />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Weitere Informationen */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-medium mb-4">Weitere Informationen</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Firmware:</span> {status?.firmware}
                  </div>
                  <div>
                    <span className="font-medium">WLAN Status:</span>{' '}
                    {status?.wifiConnected ? 'Verbunden' : 'Nicht verbunden'}
                  </div>
                  <div>
                    <span className="font-medium">Letzte Aktualisierung:</span>{' '}
                    {format(new Date(), 'PPp', { locale: de })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
} 