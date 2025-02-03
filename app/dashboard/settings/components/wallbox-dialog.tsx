'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { decrypt } from '@/services/encryption'
import { WallboxConnection } from '@/types/wallbox'

const defaultFormData = {
  id: '',
  provider_id: '',
  name: '',
  configuration: {
    name: '',
    api_key: '',
    charger_id: '',
    username: '',
    password: ''
  }
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (wallbox: any) => Promise<void>
  currentWallbox?: WallboxConnection
}

export function WallboxDialog({ open, onOpenChange, onSave, currentWallbox }: Props) {
  const [formData, setFormData] = useState(defaultFormData)
  const [isLoading, setIsLoading] = useState(false)

  // Setze Formulardaten wenn sich currentWallbox ändert oder Modal geöffnet wird
  useEffect(() => {
    if (currentWallbox && open) {
      let config = currentWallbox.configuration
      if (typeof config === 'string') {
        try {
          config = JSON.parse(decrypt(config))
        } catch (error) {
          console.error('Fehler beim Entschlüsseln der Konfiguration:', error)
          config = {}
        }
      }

      setFormData({
        id: currentWallbox.id,
        provider_id: currentWallbox.provider_id,
        name: currentWallbox.name,
        configuration: {
          name: config.name || '',
          api_key: config.api_key || '',
          charger_id: config.charger_id || '',
          username: config.username || '',
          password: config.password || ''
        }
      })
    } else if (!open) {
      setFormData(defaultFormData)
    }
  }, [currentWallbox, open])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await onSave(formData)
      onOpenChange(false)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {currentWallbox ? 'Wallbox bearbeiten' : 'Wallbox hinzufügen'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          {!currentWallbox && (
            <div className="space-y-2">
              <Label htmlFor="provider">Provider</Label>
              <Select
                value={formData.provider_id}
                onValueChange={(value) => setFormData({ ...formData, provider_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Provider auswählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="go-e">go-e</SelectItem>
                  <SelectItem value="easee">Easee</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {formData.provider_id === 'go-e' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="api_key">API Key</Label>
                <Input
                  id="api_key"
                  value={formData.configuration.api_key}
                  onChange={(e) => setFormData({
                    ...formData,
                    configuration: { ...formData.configuration, api_key: e.target.value }
                  })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="charger_id">Charger ID</Label>
                <Input
                  id="charger_id"
                  value={formData.configuration.charger_id}
                  onChange={(e) => setFormData({
                    ...formData,
                    configuration: { ...formData.configuration, charger_id: e.target.value }
                  })}
                  required
                />
              </div>
            </>
          )}

          {formData.provider_id === 'easee' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="username">Benutzername</Label>
                <Input
                  id="username"
                  value={formData.configuration.username}
                  onChange={(e) => setFormData({
                    ...formData,
                    configuration: { ...formData.configuration, username: e.target.value }
                  })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Passwort</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.configuration.password}
                  onChange={(e) => setFormData({
                    ...formData,
                    configuration: { ...formData.configuration, password: e.target.value }
                  })}
                  required
                />
              </div>
            </>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Abbrechen
            </Button>
            <Button type="submit" disabled={isLoading}>
              {currentWallbox ? 'Speichern' : 'Hinzufügen'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 