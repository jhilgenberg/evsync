import { decrypt } from '@/services/encryption'
import { WallboxConnection } from '@/types/wallbox'
import { EaseeService as EaseeWallbox } from './easee'
import { GoEWallbox, type GoEConfig } from './go-e'

function isGoEConfig(config: unknown): config is GoEConfig {
  return typeof config === 'object' && config !== null &&
    'api_key' in config && 'charger_id' in config &&
    typeof (config as any).api_key === 'string' &&
    typeof (config as any).charger_id === 'string'
}

interface EaseeConfig {
  username: string
  password: string
  charger_id: string
}

function isEaseeConfig(config: unknown): config is EaseeConfig {
  return typeof config === 'object' && config !== null &&
    'username' in config && 'password' in config && 'charger_id' in config &&
    typeof (config as any).username === 'string' &&
    typeof (config as any).password === 'string' &&
    typeof (config as any).charger_id === 'string'
}

export async function createWallboxService(connection: WallboxConnection) {
  // Entschlüssele die Konfiguration wenn sie verschlüsselt ist
  let config = connection.configuration
  if (typeof config === 'string') {
    try {
      config = JSON.parse(decrypt(config))
    } catch (error) {
      console.error('Fehler beim Entschlüsseln der Konfiguration:', error)
      throw new Error('Ungültige Wallbox-Konfiguration')
    }
  }

  switch (connection.provider_id) {
    case 'go-e':
      if (!isGoEConfig(config)) {
        throw new Error('Ungültige go-e Konfiguration')
      }
      return new GoEWallbox(config)
    case 'easee':
      if (!isEaseeConfig(config)) {
        throw new Error('Ungültige Easee Konfiguration')
      }
      return new EaseeWallbox(config)
    default:
      throw new Error(`Unbekannter Wallbox-Provider: ${connection.provider_id}`)
  }
} 