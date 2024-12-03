'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PlusCircle, Pencil } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { TariffDialog } from './components/tariff-dialog'
import { ElectricityTariff, TariffFormData } from '@/types/tariff'

export default function SettingsPage() {
  const [tariffs, setTariffs] = useState<ElectricityTariff[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedTariff, setSelectedTariff] = useState<ElectricityTariff | undefined>()
  const { toast } = useToast()

  const loadTariffs = async () => {
    try {
      const response = await fetch('/api/tariffs')
      if (!response.ok) throw new Error('Laden fehlgeschlagen')
      const data = await response.json()
      setTariffs(data)
    } catch (_error) {
      toast({
        variant: "destructive",
        title: "Fehler",
        description: "Tarife konnten nicht geladen werden",
      })
    }
  }

  useEffect(() => {
    loadTariffs()
  }, [loadTariffs])

  const handleSaveTariff = async (formData: TariffFormData) => {
    try {
      const response = await fetch('/api/tariffs', {
        method: selectedTariff ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          id: selectedTariff?.id,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error)
      }

      await loadTariffs()
      setSelectedTariff(undefined)
    } catch (error: any) {
      throw error
    }
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-medium">Einstellungen</h1>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Stromtarife</CardTitle>
          <Button onClick={() => {
            setSelectedTariff(undefined)
            setIsDialogOpen(true)
          }}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Tarif hinzufügen
          </Button>
        </CardHeader>
        <CardContent>
          {tariffs.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Noch keine Tarife hinterlegt
            </p>
          ) : (
            <div className="space-y-4">
              {tariffs.map((tariff) => (
                <div
                  key={tariff.id}
                  className="flex items-center justify-between p-4 rounded-lg border"
                >
                  <div>
                    <h3 className="font-medium">{tariff.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {tariff.energy_rate.toFixed(2)} ct/kWh + {tariff.base_rate_monthly.toFixed(2)} €/Monat
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Gültig ab: {new Date(tariff.valid_from).toLocaleDateString()}
                      {tariff.valid_to && ` bis ${new Date(tariff.valid_to).toLocaleDateString()}`}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSelectedTariff(tariff)
                      setIsDialogOpen(true)
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <TariffDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={handleSaveTariff}
        currentTariff={selectedTariff}
      />
    </div>
  )
} 