import { WallboxConnection } from '@/types/wallbox'
import { GoEService } from './go-e'

export function createWallboxService(connection: WallboxConnection) {
  switch (connection.provider_id) {
    case 'go-e':
      if (!('api_key' in connection.configuration && 'charger_id' in connection.configuration)) {
        throw new Error('Go-E Konfiguration benötigt api_key und charger_id')
      }
      return new GoEService(connection.configuration as { api_key: string; charger_id: string })
    default:
      throw new Error(`Unbekannter Provider: ${connection.provider_id}`)
  }
} 