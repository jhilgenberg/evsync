import { WallboxProvider } from '@/types/wallbox'

export const WALLBOX_PROVIDERS: WallboxProvider[] = [
  {
    id: 'go-e',
    name: 'go-e Charger',
    logo: '/logos/go-e.png',
    description: 'Verbinde dich mit deinem go-e Charger über die Cloud API V3.',
    fields: [
      {
        id: 'charger_id',
        label: 'Seriennummer',
        type: 'text',
        required: true,
        placeholder: 'GExxxxxxxxxxxx',
        helpText: 'Die Seriennummer findest du auf deiner Wallbox oder in der go-e App'
      },
      {
        id: 'api_key',
        label: 'API Token',
        type: 'password',
        required: true,
        helpText: 'Den API Token findest du in der go-e App unter Einstellungen → API'
      }
    ]
  }
] 