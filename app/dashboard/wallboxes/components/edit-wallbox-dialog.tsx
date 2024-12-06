'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { WallboxConnection } from '@/types/wallbox'
import { WALLBOX_PROVIDERS } from '@/config/wallbox-providers'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (connection: WallboxConnection) => Promise<void>
  connection: WallboxConnection
}

export function EditWallboxDialog({ open, onOpenChange, onSave, connection }: Props) {
  const provider = WALLBOX_PROVIDERS.find(p => p.id === connection.provider_id)
  const [formData, setFormData] = useState<Record<string, string>>({
    name: connection.name,
    ...connection.configuration
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!provider) return

    const updatedConnection: WallboxConnection = {
      ...connection,
      name: formData.name,
      configuration: Object.fromEntries(
        provider.fields.map(field => [field.id, formData[field.id]])
      )
    }

    await onSave(updatedConnection)
    onOpenChange(false)
  }

  if (!provider) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Wallbox bearbeiten</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name der Wallbox</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="z.B. Garage"
              required
            />
          </div>

          {provider.fields.map((field) => (
            <div key={field.id} className="space-y-2">
              <Label htmlFor={field.id}>{field.label}</Label>
              <Input
                id={field.id}
                type={field.type}
                value={formData[field.id] || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  [field.id]: e.target.value
                }))}
                placeholder={field.placeholder}
                required={field.required}
              />
              {field.helpText && (
                <p className="text-sm text-muted-foreground">
                  {field.helpText}
                </p>
              )}
            </div>
          ))}

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Abbrechen
            </Button>
            <Button type="submit">Speichern</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 