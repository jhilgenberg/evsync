export enum WallboxCarState {
  UNKNOWN = 'UNKNOWN',
  READY = 'READY',
  CHARGING = 'CHARGING',
  WAITING = 'WAITING',
  FINISHED = 'FINISHED'
}

export type PhaseInfo = {
  voltage: number        // Spannung in V
  current: number        // Strom in A
  power: number         // Leistung in kW
  powerFactor: number   // Leistungsfaktor in %
}

export type DetailedPowerInfo = {
  totalPower: number    // Gesamtleistung in kW
  phases: {
    l1: PhaseInfo
    l2: PhaseInfo
    l3: PhaseInfo
    n?: PhaseInfo      // Optional für Neutral
  }
}

export type WallboxStatus = {
  isOnline: boolean
  carState: WallboxCarState
  currentPower: number     // in kW
  totalEnergy: number      // in kWh
  temperature: number      // in °C
  firmware: string
  wifiConnected: boolean
  details: {
    power: DetailedPowerInfo
    rawData?: unknown     // Für debugging/entwickler
  }
}

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

export interface ChargingSession {
    id: string;
    start_time: string;
    end_time: string;
    energy: number;
    max_power: number;
    duration_minutes: number;
    id_chip?: string;
    id_chip_uid?: string;
    id_chip_name?: string;
}

export type Car = {
  id: string
  make: string
  model: string
  license_plate: string
  user_id: string
  name?: string  // Optional machen
} 