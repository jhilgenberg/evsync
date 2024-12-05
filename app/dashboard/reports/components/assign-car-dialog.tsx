'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Car } from '@/types/wallbox'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAssign: (carId: string) => Promise<void>
  cars: Car[]
}

export function AssignCarDialog({ open, onOpenChange, onAssign, cars }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Auto zuweisen</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="car">Auto auswählen</Label>
            <select
              id="car"
              onChange={(e) => {
                if (e.target.value) {
                  onAssign(e.target.value);
                  onOpenChange(false);
                }
              }}
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1"
            >
              <option value="">Bitte wählen...</option>
              {cars.map((car) => (
                <option key={car.id} value={car.id}>
                  {car.make} {car.model} ({car.license_plate})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Abbrechen
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 