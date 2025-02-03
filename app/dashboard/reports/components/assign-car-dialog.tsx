'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Car } from '@/types/wallbox'
import { useState, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'

interface AssignCarDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sessionIds: string[]
  cars: Car[]
  onAssign: (sessionIds: string[], carId: string) => Promise<void>
}

export function AssignCarDialog({
  open,
  onOpenChange,
  sessionIds,
  cars,
  onAssign
}: AssignCarDialogProps) {
  const [selectedCar, setSelectedCar] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      setSelectedCar('')
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Auto zuweisen</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Select value={selectedCar} onValueChange={setSelectedCar}>
            <SelectTrigger>
              <SelectValue placeholder="Auto auswählen" />
            </SelectTrigger>
            <SelectContent>
              {cars.map(car => (
                <SelectItem key={car.id} value={car.id}>
                  {car.make} {car.model} ({car.license_plate})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Abbrechen
            </Button>
            <Button
              onClick={async () => {
                if (!selectedCar) {
                  toast({
                    variant: 'destructive',
                    title: 'Fehler',
                    description: 'Bitte wählen Sie ein Auto aus'
                  })
                  return
                }

                try {
                  setIsLoading(true)
                  await onAssign(sessionIds, selectedCar)
                  onOpenChange(false)
                  toast({
                    title: 'Erfolg',
                    description: 'Auto wurde zugewiesen'
                  })
                } catch {
                  toast({
                    variant: 'destructive',
                    title: 'Fehler',
                    description: 'Auto konnte nicht zugewiesen werden'
                  })
                } finally {
                  setIsLoading(false)
                }
              }}
              disabled={!selectedCar || isLoading}
            >
              {sessionIds.length > 1 ? `${sessionIds.length} Ladevorgänge zuweisen` : 'Zuweisen'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 