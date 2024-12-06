'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { WallboxConnection, WallboxStatus } from '@/types/wallbox'
import { WallboxDetailsDialog } from './wallbox-details-dialog'
import { EditWallboxDialog } from './edit-wallbox-dialog'
import { Zap, Battery, MoreVertical, Pencil, Trash2 } from 'lucide-react'
import Image from 'next/image'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Props {
  connection: WallboxConnection
  providerName: string
  providerLogo: string
  onEdit: (connection: WallboxConnection) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export function WallboxCard({ connection, providerName, providerLogo, onEdit, onDelete }: Props) {
  const [showDetails, setShowDetails] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [status, setStatus] = useState<WallboxStatus>()
  const { toast } = useToast()

  const loadStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/wallboxes/${connection.id}/status`)
      if (!response.ok) throw new Error()
      const data = await response.json()
      setStatus(data)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Fehler",
        description: "Status konnte nicht geladen werden",
      })
      console.error(error)
    }
  }, [connection.id, toast])

  // Automatische Aktualisierung alle 30 Sekunden
  useEffect(() => {
    loadStatus()
    const interval = setInterval(loadStatus, 30000)
    return () => clearInterval(interval)
  }, [loadStatus])

  const handleShowDetails = () => {
    setShowDetails(true)
  }

  const isCharging = status?.carState === 'CHARGING'

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 relative flex-shrink-0">
              <Image
                src={providerLogo}
                alt={providerName}
                width={48}
                height={48}
                className="object-contain"
              />
              <div className={cn(
                "absolute -top-1 -right-1 h-3 w-3 rounded-full border-2 border-background",
                status?.isOnline ? "bg-green-500" : "bg-red-500"
              )} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium truncate">{connection.name}</h3>
              <p className="text-sm text-muted-foreground truncate">
                {providerName}
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowEdit(true)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Bearbeiten
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setShowDelete(true)}
                  className="text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Löschen
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Zap className={cn(
                "h-4 w-4",
                isCharging && "text-green-500 animate-pulse"
              )} />
              <div>
                <p className="text-sm text-muted-foreground">Leistung</p>
                <p className="font-medium">{status?.currentPower.toFixed(1)} kW</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Battery className="h-4 w-4" />
              <div>
                <p className="text-sm text-muted-foreground">Geladen</p>
                <p className="font-medium">{status?.totalEnergy.toFixed(1)} kWh</p>
              </div>
            </div>
          </div>

          {isCharging && (
            <div className="mt-4 relative h-2 bg-muted rounded-full overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-green-500 animate-progress" />
            </div>
          )}

          <div className="mt-4 flex justify-end">
            <Button variant="outline" onClick={handleShowDetails}>
              Details
            </Button>
          </div>
        </CardContent>
      </Card>

      <WallboxDetailsDialog
        open={showDetails}
        onOpenChange={setShowDetails}
        connection={connection}
        status={status}
      />

      <EditWallboxDialog
        open={showEdit}
        onOpenChange={setShowEdit}
        connection={connection}
        onSave={onEdit}
      />

      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Wallbox löschen</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie die Wallbox &quot;{connection.name}&quot; wirklich löschen? 
              Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => onDelete(connection.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
} 