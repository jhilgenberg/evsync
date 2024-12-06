import { GoEService } from './go-e'
import { EaseeService } from './easee'
import { EncryptionService } from '@/services/encryption'

export function createWallboxService(connection: any) {
  const encryptionService = new EncryptionService()
  const decryptedConfig = encryptionService.decryptConfig(connection.configuration)

  switch (connection.provider_id) {
    case 'go-e':
      return new GoEService({
        api_key: decryptedConfig.api_key,
        charger_id: decryptedConfig.charger_id
      })
    case 'easee':
      return new EaseeService({
        username: decryptedConfig.username,
        password: decryptedConfig.password,
        charger_id: decryptedConfig.charger_id
      })
    default:
      throw new Error('Unbekannter Wallbox-Provider')
  }
} 