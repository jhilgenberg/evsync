import { WallboxProvider } from '@/types/wallbox'

export const WALLBOX_PROVIDERS: WallboxProvider[] = [
  {
    id: 'go-e',
    name: 'go-e',
    logo: '/logos/go-e.png',
    description: 'go-e HOME+ und CHARGER',
    fields: [
      {
        id: 'api_key',
        label: 'API-Schlüssel',
        type: 'password',
        required: true,
        helpText: 'Zu finden in der go-e Cloud unter API'
      },
      {
        id: 'charger_id',
        label: 'Charger ID',
        type: 'text',
        required: true,
        helpText: 'Die Seriennummer Ihrer Wallbox'
      }
    ]
  },
  {
    id: 'easee',
    name: 'Easee',
    logo: '/logos/easee.png',
    description: 'Easee Home und Charge',
    fields: [
      {
        id: 'username',
        label: 'Benutzername',
        type: 'email',
        required: true,
        helpText: 'Ihre E-Mail-Adresse für die Easee Cloud'
      },
      {
        id: 'password',
        label: 'Passwort',
        type: 'password',
        required: true,
        helpText: 'Ihr Passwort für die Easee Cloud'
      },
      {
        id: 'charger_id',
        label: 'Charger ID',
        type: 'text',
        required: true,
        helpText: 'Die Seriennummer Ihrer Wallbox'
      }
    ]
  }
] 