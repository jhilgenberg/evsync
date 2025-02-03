import { WallboxStatus, WallboxCarState, type PhaseInfo } from '@/types/wallbox'
import { WallboxService } from '@/types/wallbox-service'

interface EaseeToken {
  accessToken: string
  expiresIn: number
  tokenType: string
}

interface EaseeState {
  smartCharging: boolean
  cableLocked: boolean
  chargerOpMode: number // 1=disconnected, 2=awaiting start, 3=charging, 4=completed, 5=error
  totalPower: number
  sessionEnergy: number
  energyPerHour: number
  wiFiRSSI: number
  cellRSSI: number
  localRSSI: number
  outputPhase: number
  dynamicCircuitCurrentP1: number
  dynamicCircuitCurrentP2: number
  dynamicCircuitCurrentP3: number
  latestPulse: string
  chargerFirmware: string
  voltage: number
  outputCurrent: number
  isOnline: boolean
  inCurrentT2: number
  inCurrentT3: number
  inCurrentT4: number
  inCurrentT5: number
  outputCurrentT2: number
  outputCurrentT3: number
  outputCurrentT4: number
  outputCurrentT5: number
  inVoltageT1T2: number
  inVoltageT1T3: number
  inVoltageT1T4: number
  inVoltageT1T5: number
  inVoltageT2T3: number
  inVoltageT2T4: number
  inVoltageT2T5: number
  inVoltageT3T4: number
  inVoltageT3T5: number
  inVoltageT4T5: number
  ledMode: number
  cableRating: number
  dynamicChargerCurrent: number
  circuitTotalAllocatedPhaseConductorCurrentL1: number
  circuitTotalAllocatedPhaseConductorCurrentL2: number
  circuitTotalAllocatedPhaseConductorCurrentL3: number
  circuitTotalPhaseConductorCurrentL1: number
  circuitTotalPhaseConductorCurrentL2: number
  circuitTotalPhaseConductorCurrentL3: number
  reasonForNoCurrent: number
  wiFiAPEnabled: boolean
  lifetimeEnergy: number
  offlineMaxCircuitCurrentP1: number
  offlineMaxCircuitCurrentP2: number
  offlineMaxCircuitCurrentP3: number
}

interface EaseeSession {
  sessionId: string
  startTime: string
  endTime: string
  totalEnergy: number
  maxPower: number
  totalDuration: number
}

export class EaseeService implements WallboxService {
  private baseUrl = 'https://api.easee.cloud/api'
  private token: string | null = null
  private tokenExpiry: number = 0
  private chargerId: string
  private username: string
  private password: string

  constructor(config: { username: string; password: string; charger_id: string }) {
    this.username = config.username
    this.password = config.password
    this.chargerId = config.charger_id
  }

  private async authenticate(): Promise<void> {
    if (this.token && Date.now() < this.tokenExpiry) return

    const response = await fetch(`${this.baseUrl}/accounts/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userName: this.username,
        password: this.password
      })
    })

    if (!response.ok) {
      throw new Error('Authentifizierung fehlgeschlagen')
    }

    const data: EaseeToken = await response.json()
    this.token = data.accessToken
    this.tokenExpiry = Date.now() + (data.expiresIn * 1000) - 60000 // 1 Minute Puffer
  }

  private async request<T>(endpoint: string, method: string = 'GET'): Promise<T> {
    await this.authenticate()

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`)
    }

    return response.json()
  }

  private mapChargerState(opMode: number): WallboxCarState {
    switch (opMode) {
      case 1: return WallboxCarState.UNKNOWN
      case 2: return WallboxCarState.WAITING
      case 3: return WallboxCarState.CHARGING
      case 4: return WallboxCarState.FINISHED
      case 5: return WallboxCarState.UNKNOWN
      default: return WallboxCarState.UNKNOWN
    }
  }

  async getStatus(): Promise<WallboxStatus> {
    const state: EaseeState = await this.request(`/chargers/${this.chargerId}/state`)

    const getPhaseInfo = (current: number, voltage: number): PhaseInfo => ({
      voltage: voltage,
      current: current,
      power: (voltage * current) / 1000, // Umrechnung in kW
      powerFactor: 1 // Easee liefert keinen Leistungsfaktor
    })

    return {
      isOnline: state.isOnline,
      carState: this.mapChargerState(state.chargerOpMode),
      currentPower: state.totalPower / 1000, // Umrechnung in kW
      totalEnergy: state.lifetimeEnergy / 1000, // Umrechnung in kWh
      temperature: 0, // Easee liefert keine Temperatur
      firmware: state.chargerFirmware,
      wifiConnected: state.wiFiRSSI > -100, // Einfache WLAN-Prüfung
      details: {
        power: {
          totalPower: state.totalPower / 1000,
          phases: {
            l1: getPhaseInfo(state.dynamicCircuitCurrentP1, state.inVoltageT1T2),
            l2: getPhaseInfo(state.dynamicCircuitCurrentP2, state.inVoltageT2T3),
            l3: getPhaseInfo(state.dynamicCircuitCurrentP3, state.inVoltageT3T4)
          }
        },
        rawData: state
      }
    }
  }

  async getChargingSessions(from?: Date, to?: Date): Promise<any[]> {
    const fromStr = from ? from.toISOString() : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const toStr = to ? to.toISOString() : new Date().toISOString()

    const sessions = await this.request<EaseeSession[]>(
      `/chargers/${this.chargerId}/sessions?from=${fromStr}&to=${toStr}`
    )

    return sessions.map((session) => ({
      id: session.sessionId,
      start_time: session.startTime,
      end_time: session.endTime,
      energy: session.totalEnergy,
      max_power: session.maxPower,
      duration_minutes: session.totalDuration
    }))
  }

  async getCurrentSession() {
    return this.request(`/chargers/${this.chargerId}/session`)
  }

  async getEnergy() {
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    return this.getChargingSessions(thirtyDaysAgo, now)
  }
} 