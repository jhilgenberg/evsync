'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ElectricityTariff, TariffFormData } from '@/types/tariff'
import { useToast } from '@/hooks/use-toast'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (tariff: TariffFormData) => Promise<void>
  currentTariff?: ElectricityTariff
}

export function TariffDialog({ open, onOpenChange, onSave, currentTariff }: Props) {
  const { toast } = useToast()
  const [formData, setFormData] = useState<TariffFormData>(() => ({
    name: currentTariff?.name ?? '',
    base_rate_monthly: currentTariff?.base_rate_monthly ?? 0,
    energy_rate: currentTariff?.energy_rate ?? 0,
    valid_from: currentTariff?.valid_from ?? new Date().toISOString().split('T')[0],
    valid_to: currentTariff?.valid_to ?? null,
  }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await onSave(formData)
      onOpenChange(false)
      toast({
        title: "Erfolg",
        description: "Stromtarif wurde gespeichert",
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Fehler",
        description: error.message,
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {currentTariff ? 'Stromtarif bearbeiten' : 'Stromtarif hinzufügen'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Bezeichnung</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                name: e.target.value
              }))}
              placeholder="z.B. Grundversorgung"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="base_rate">Grundgebühr (€/Monat)</Label>
            <Input
              id="base_rate"
              type="number"
              step="0.01"
              value={formData.base_rate_monthly}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                base_rate_monthly: parseFloat(e.target.value)
              }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="energy_rate">Arbeitspreis (ct/kWh)</Label>
            <Input
              id="energy_rate"
              type="number"
              step="0.0001"
              value={formData.energy_rate}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                energy_rate: parseFloat(e.target.value)
              }))}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="valid_from">Gültig ab</Label>
              <Input
                id="valid_from"
                type="date"
                value={formData.valid_from.split('T')[0]}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  valid_from: e.target.value
                }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="valid_to">Gültig bis</Label>
              <Input
                id="valid_to"
                type="date"
                value={formData.valid_to?.split('T')[0] ?? ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  valid_to: e.target.value || null
                }))}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Abbrechen
            </Button>
            <Button type="submit">
              Speichern
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 