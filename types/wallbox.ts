export type WallboxProvider = {
  id: string
  name: string
  logo: string
  description: string
  fields: WallboxField[]
}

export type WallboxField = {
  id: string
  label: string
  type: 'text' | 'password' | 'email' | 'url' | 'select'
  required: boolean
  placeholder?: string
  options?: { label: string; value: string }[]
  helpText?: string
}

export type WallboxConnection = {
  id: string
  user_id: string
  provider_id: string
  name: string
  configuration: Record<string, any>
  created_at: string
  last_sync: string | null
} 