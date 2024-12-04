import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { WallboxConnection, WallboxStatus, WallboxCarState } from '@/types/wallbox'
import { Battery, Plug, Zap, RefreshCw, ThermometerSun } from 'lucide-react'
import { cn } from '@/lib/utils'
import { WallboxDetailsDialog } from './wallbox-details-dialog'
import Image from 'next/image'

type Props = {
  connection: WallboxConnection
  providerName: string
  providerLogo: string
}

export function WallboxCard({ connection, providerName, providerLogo }: Props) {
  const [status, setStatus] = useState<WallboxStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  const fetchStatus = useCallback(async () => {
    try {
      setIsRefreshing(true)
      const response = await fetch(`/api/wallboxes/${connection.id}/status`)
      if (!response.ok) throw new Error('Fehler beim Laden des Status')
      const data: WallboxStatus = await response.json()
      setStatus(data)
    } catch (error) {
      console.error('Status Fehler:', error)
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [connection.id])

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 30000)
    return () => clearInterval(interval)
  }, [fetchStatus])

  const getCarStatusText = (carState: WallboxCarState) => {
    switch (carState) {
      case WallboxCarState.READY: return 'Bereit, kein Fahrzeug'
      case WallboxCarState.CHARGING: return 'Fahrzeug lädt'
      case WallboxCarState.WAITING: return 'Warte auf Fahrzeug'
      case WallboxCarState.FINISHED: return 'Ladung beendet'
      default: return 'Unbekannt'
    }
  }

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader className="space-y-1">
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-2">
              <Image 
                src={providerLogo} 
                alt={providerName} 
                width={32}
                height={32}
                className="w-8 h-8 object-contain"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={fetchStatus}
                disabled={isRefreshing}
                className={cn(
                  "h-8 w-8 p-0",
                  isRefreshing && "animate-spin"
                )}
              >
                <RefreshCw className="h-4 w-4" />
                <span className="sr-only">Aktualisieren</span>
              </Button>
            </div>
            {status?.isOnline ? (
              <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                Online
              </span>
            ) : (
              <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                Offline
              </span>
            )}
          </div>
          <CardTitle>{connection.name}</CardTitle>
          <CardDescription>
            {status?.wifiConnected ? 'Verbunden' : 'Nicht verbunden'} • 
            Firmware: {status?.firmware || 'Unbekannt'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Plug className="mr-1 h-4 w-4" />
                    Status
                  </div>
                  <p className="font-medium">
                    {status ? getCarStatusText(status.carState) : 'Unbekannt'}
                  </p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Zap className="mr-1 h-4 w-4" />
                    Leistung
                  </div>
                  <p className="font-medium">
                    {status?.currentPower.toFixed(2)} kW
                  </p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Battery className="mr-1 h-4 w-4" />
                    Geladen
                  </div>
                  <p className="font-medium">
                    {status?.totalEnergy.toFixed(2)} kWh
                  </p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <ThermometerSun className="mr-1 h-4 w-4" />
                    Temperatur
                  </div>
                  <p className="font-medium">
                    {status?.temperature}°C
                  </p>
                </div>
              </div>

              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setShowDetails(true)}
              >
                Details
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <WallboxDetailsDialog
        open={showDetails}
        onOpenChange={setShowDetails}
        connection={connection}
      />
    </>
  )
} 