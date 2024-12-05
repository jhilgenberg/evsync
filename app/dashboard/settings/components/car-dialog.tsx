'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Car } from '@/types/wallbox';

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (car: Car) => Promise<void>
  currentCar?: Car // Optional: Aktuelles Auto für die Bearbeitung
}

export function CarDialog({ open, onOpenChange, onSave, currentCar }: Props) {
  const [formData, setFormData] = useState<Car>({
    id: currentCar?.id || '', // ID des Autos
    make: currentCar?.make || '',
    model: currentCar?.model || '',
    license_plate: currentCar?.license_plate || '',
  });

  useEffect(() => {
    if (currentCar) {
      setFormData({
        id: currentCar.id,
        make: currentCar.make,
        model: currentCar.model,
        license_plate: currentCar.license_plate,
      });
    }
  }, [currentCar]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await onSave(formData);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{currentCar ? 'Auto bearbeiten' : 'Auto hinzufügen'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="make">Marke</Label>
            <Input
              id="make"
              value={formData.make}
              onChange={(e) => setFormData({ ...formData, make: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="model">Modell</Label>
            <Input
              id="model"
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="license_plate">Kennzeichen</Label>
            <Input
              id="license_plate"
              value={formData.license_plate}
              onChange={(e) => setFormData({ ...formData, license_plate: e.target.value })}
              required
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button type="submit">{currentCar ? 'Ändern' : 'Speichern'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 