'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { WALLBOX_PROVIDERS } from '@/config/wallbox-providers'
import { WallboxConnection, WallboxProvider } from '@/types/wallbox'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (connection: WallboxConnection) => Promise<void>
}

export function AddWallboxDialog({ open, onOpenChange, onAdd }: Props) {
  const [step, setStep] = useState<'provider' | 'config'>('provider')
  const [selectedProvider, setSelectedProvider] = useState<WallboxProvider | null>(null)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [name, setName] = useState('')

  const handleProviderSelect = (provider: WallboxProvider) => {
    setSelectedProvider(provider)
    setStep('config')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProvider) return

    const connection: WallboxConnection = {
      id: crypto.randomUUID(),
      user_id: 'current-user-id', // Später durch echte User-ID ersetzen
      provider_id: selectedProvider.id,
      name,
      configuration: formData,
      created_at: new Date().toISOString(),
      last_sync: null
    }

    await onAdd(connection)
    resetForm()
  }

  const resetForm = () => {
    setStep('provider')
    setSelectedProvider(null)
    setFormData({})
    setName('')
  }

  return (
    <Dialog open={open} onOpenChange={(open) => {
      onOpenChange(open)
      if (!open) resetForm()
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {step === 'provider' ? 'Wallbox-Hersteller auswählen' : 'Wallbox konfigurieren'}
          </DialogTitle>
        </DialogHeader>

        {step === 'provider' ? (
          <div className="grid gap-4">
            {WALLBOX_PROVIDERS.map((provider) => (
              <Button
                key={provider.id}
                variant="outline"
                className="flex items-center justify-start h-auto p-4"
                onClick={() => handleProviderSelect(provider)}
              >
                <img 
                  src={provider.logo} 
                  alt={provider.name} 
                  className="h-8 w-auto mr-4"
                />
                <div className="text-left">
                  <h3 className="font-medium">{provider.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {provider.description}
                  </p>
                </div>
              </Button>
            ))}
          </div>
        ) : selectedProvider && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name der Wallbox</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="z.B. Garage"
                required
              />
            </div>

            {selectedProvider.fields.map((field) => (
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
                onClick={() => setStep('provider')}
              >
                Zurück
              </Button>
              <Button type="submit">
                Verbinden
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
} 