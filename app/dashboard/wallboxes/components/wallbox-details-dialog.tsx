'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
import { WallboxConnection } from '@/types/wallbox'
import { GoEStatus } from '@/types/go-e'
import { 
  Battery, 
  Zap,  
  ThermometerSun,
  RefreshCw,
  Power
} from 'lucide-react'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  connection: WallboxConnection
}

export function WallboxDetailsDialog({ open, onOpenChange, connection }: Props) {
  const [status, setStatus] = useState<GoEStatus | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchStatus = async () => {
    try {
      const response = await fetch(`/api/wallboxes/${connection.id}/status`)
      if (!response.ok) throw new Error('Fehler beim Laden des Status')
      const data = await response.json()
      setStatus(data)
    } catch (error) {
      console.error('Status Fehler:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      fetchStatus()
      const interval = setInterval(fetchStatus, 5000)
      return () => clearInterval(interval)
    }
  }, [open, connection.id])

  const getCarStatus = (car?: number) => {
    switch (car) {
      case 1: return 'Bereit, kein Fahrzeug'
      case 2: return 'Fahrzeug lädt'
      case 3: return 'Warte auf Fahrzeug'
      case 4: return 'Ladung beendet'
      default: return 'Unbekannt'
    }
  }

  const getWifiStatus = (wst?: number) => {
    return wst === 3 ? 'Verbunden' : 'Nicht verbunden'
  }

  const getWifiSSID = (status: GoEStatus | null) => {
    return status?.ccw?.ssid || 'Unbekannt'
  }

  const getWifiIP = (status: GoEStatus | null) => {
    return status?.ccw?.ip || 'Unbekannt'
  }

  const getCurrentPower = () => {
    if (!status?.nrg) return 0
    return status.nrg[11] / 100
  }

  const getPhaseInfo = () => {
    if (!status?.nrg) return []

    let nrgValues = [...status.nrg]
    const phaseValue = Number(status.pha || 0)
    if (Math.floor(phaseValue / 8) === 1 && 
        parseInt(String(nrgValues[3])) > parseInt(String(nrgValues[0]))) {
      nrgValues[0] = nrgValues[3]
      nrgValues[7] = nrgValues[10]
      nrgValues[12] = nrgValues[15]
    }

    return [
      {
        phase: 'L1',
        voltage: nrgValues[0],
        current: nrgValues[4] / 10,
        power: nrgValues[7] / 10
      },
      {
        phase: 'L2',
        voltage: nrgValues[1],
        current: nrgValues[5] / 10,
        power: nrgValues[8] / 10
      },
      {
        phase: 'L3',
        voltage: nrgValues[2],
        current: nrgValues[6] / 10,
        power: nrgValues[9] / 10
      }
    ]
  }

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
                      {getCarStatus(status?.car)}
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
                      {getCurrentPower().toFixed(2)} kW
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
                      {((status?.wh || 0) / 1000).toFixed(2)} kWh
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
                      {status?.tma?.[0] || status?.tmp || 0}°C
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Phasen-Details */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-medium mb-4">Phasen-Details</h3>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div className="font-medium">Phase</div>
                  <div className="font-medium">Spannung</div>
                  <div className="font-medium">Strom</div>
                  <div className="font-medium">Leistung</div>
                  {getPhaseInfo().map((phase) => (
                    <>
                      <div>{phase.phase}</div>
                      <div>{phase.voltage.toFixed(0)} V</div>
                      <div>{phase.current.toFixed(1)} A</div>
                      <div>{phase.power.toFixed(2)} kW</div>
                    </>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Weitere Informationen */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-medium mb-4">Weitere Informationen</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Firmware:</span> {status?.fwv}
                  </div>
                  <div>
                    <span className="font-medium">WLAN Status:</span> {getWifiStatus(status?.wst)}
                  </div>
                  <div>
                    <span className="font-medium">WLAN SSID:</span> {getWifiSSID(status)}
                  </div>
                  <div>
                    <span className="font-medium">IP-Adresse:</span> {getWifiIP(status)}
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