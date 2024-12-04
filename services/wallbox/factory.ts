import { GoEService } from './go-e'
import { EaseeService } from './easee'

export function createWallboxService(connection: any) {
  switch (connection.provider_id) {
    case 'go-e':
      return new GoEService(connection.configuration)
    case 'easee':
      return new EaseeService(connection.configuration)
    default:
      throw new Error('Unbekannter Wallbox-Provider')
  }
} 