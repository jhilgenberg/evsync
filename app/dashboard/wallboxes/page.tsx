'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PlusCircle } from 'lucide-react'
import { WALLBOX_PROVIDERS } from '@/config/wallbox-providers'
import { WallboxConnection } from '@/types/wallbox'
import { AddWallboxDialog } from './components/add-wallbox-dialog'
import { useToast } from '@/hooks/use-toast'
import { WallboxCard } from './components/wallbox-card'
import { useCallback } from 'react'

export default function WallboxesPage() {
  const [connections, setConnections] = useState<WallboxConnection[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const loadConnections = useCallback(async () => {
    try {
      const response = await fetch('/api/wallboxes')
      if (!response.ok) throw new Error('Laden fehlgeschlagen')
      const data = await response.json()
      setConnections(data)
    } catch (error: unknown) {
      toast({
        variant: "destructive",
        title: "Fehler",
        description: "Wallboxen konnten nicht geladen werden",
      })
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadConnections()
  }, [loadConnections])

  const handleAddWallbox = async (connection: WallboxConnection) => {
    try {
      const response = await fetch('/api/wallboxes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(connection),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error)
      }

      await loadConnections()
      setIsDialogOpen(false)
      toast({
        title: "Erfolg",
        description: "Wallbox wurde erfolgreich hinzugefügt",
      })
    } catch (error: unknown) {
      toast({
        variant: "destructive",
        title: "Fehler",
        description: error instanceof Error ? error.message : 'Ein unbekannter Fehler ist aufgetreten',
      })
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-screen">
      <p>Laden...</p>
    </div>
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-medium">Wallboxen</h1>
        <Button onClick={() => setIsDialogOpen(true)}>
          <PlusCircle className="sm:mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Wallbox hinzufügen</span>
        </Button>
      </div>

      {connections.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-48">
            <p className="text-muted-foreground mb-4">
              Noch keine Wallbox verbunden
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              Erste Wallbox hinzufügen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {connections.map((connection) => {
            const provider = WALLBOX_PROVIDERS.find(
              p => p.id === connection.provider_id
            )
            if (!provider) return null

            return (
              <WallboxCard
                key={connection.id}
                connection={connection}
                providerName={provider.name}
                providerLogo={provider.logo}
              />
            )
          })}
        </div>
      )}

      <AddWallboxDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen}
        onAdd={handleAddWallbox}
      />
    </div>
  )
} 