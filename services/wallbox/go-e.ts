import { WallboxStatus, WallboxCarState, type PhaseInfo } from '@/types/wallbox'
import { GoEStatus } from '@/types/go-e'

interface GoEChargingSession {
  session_number: number
  session_identifier: string
  start: string
  end: string
  seconds_total: string
  seconds_charged: string
  max_power: number
  max_current: number
  energy: number
  eto_diff: number
  eto_start: number
  eto_end: number
  wifi: string
  link: string
}

interface GoEResponse {
  columns: Array<{ key: string; type?: string; unit?: string; hide?: boolean }>
  data: GoEChargingSession[]
}

export class GoEService {
  private baseUrl: string
  private apiKey: string
  private dataToken: string | null = null

  constructor(config: { api_key: string; charger_id: string }) {
    this.apiKey = config.api_key
    this.baseUrl = `https://${config.charger_id}.api.v3.go-e.io`
  }

  private async request(endpoint: string) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`)
    }

    return response.json()
  }

  private async getDataToken() {
    if (this.dataToken) return this.dataToken
    
    const rawStatus: GoEStatus = await this.request('/api/status')
    if (!rawStatus.dll) {
      throw new Error('Kein Data-Link verfügbar')
    }

    // Extrahiere den e-Parameter aus der URL
    const url = new URL(rawStatus.dll)
    const token = url.searchParams.get('e')
    if (!token) {
      throw new Error('Kein Data-Token gefunden')
    }

    this.dataToken = token
    return token
  }

  async getStatus(): Promise<WallboxStatus> {
    const rawStatus: GoEStatus = await this.request('/api/status')
    return this.mapToWallboxStatus(rawStatus)
  }

  private mapToWallboxStatus(status: GoEStatus): WallboxStatus {
    // Berechne die Phaseninfos basierend auf der Go-E Logik
    const useNeutralVoltage = Math.floor(Number(status.pha)/8) === 1 && 
                             status.nrg[3] > status.nrg[0]

    const getPhaseInfo = (index: number): PhaseInfo => ({
      voltage: useNeutralVoltage && index === 0 ? status.nrg[3] : status.nrg[index],
      current: status.nrg[index + 4] / 10,
      power: status.nrg[index + 7] / 10,
      powerFactor: useNeutralVoltage && index === 0 ? 
        status.nrg[15] : status.nrg[index + 12]
    })

    return {
      isOnline: status.err === 0,
      carState: this.mapCarState(status.car),
      currentPower: status.nrg ? status.nrg[11] / 10 : 0,
      totalEnergy: (status.wh || 0) / 1000,
      temperature: Array.isArray(status.tma) ? status.tma[0] : 
                  (Array.isArray(status.tmp) ? status.tmp[0] : 0),
      firmware: status.fwv || 'Unbekannt',
      wifiConnected: status.wst === 3,
      details: {
        power: {
          totalPower: status.nrg[11] / 100,
          phases: {
            l1: getPhaseInfo(0),
            l2: getPhaseInfo(1),
            l3: getPhaseInfo(2),
            n: {
              voltage: status.nrg[3],
              current: 0, // N hat keinen Strom
              power: status.nrg[10] / 10,
              powerFactor: status.nrg[15]
            }
          }
        }
      }
    }
  }

  private mapCarState(carStatus: number): WallboxCarState {
    switch (carStatus) {
      case 1: return WallboxCarState.READY
      case 2: return WallboxCarState.CHARGING
      case 3: return WallboxCarState.WAITING
      case 4: return WallboxCarState.FINISHED
      default: return WallboxCarState.UNKNOWN
    }
  }

  async getChargingSessions(from?: Date, to?: Date) {
    const token = await this.getDataToken()
    let url = `https://data.v3.go-e.io/api/v1/direct_json?e=${token}`

    if (from && to) {
      url += `&from=${from.getTime()}&to=${to.getTime()}&timezone=Europe/Berlin`
    }

    const response = await fetch(url)
    if (!response.ok) {
      throw new Error('Fehler beim Abrufen der Ladevorgänge')
    }

    const data: GoEResponse = await response.json()
    
    // Transformiere die Daten in das erwartete Format
    return data.data.map(session => ({
      id: session.session_identifier,
      start_time: this.parseGoEDate(session.start),
      end_time: this.parseGoEDate(session.end),
      energy: session.energy,
      max_power: session.max_power,
      duration_minutes: this.parseGoEDuration(session.seconds_charged),
      raw: session
    }))
  }

  private parseGoEDate(dateStr: string): string {
    // Konvertiere "31.10.2024 15:58:50" zu ISO String
    const [date, time] = dateStr.split(' ')
    const [day, month, year] = date.split('.')
    return new Date(`${year}-${month}-${day}T${time}`).toISOString()
  }

  private parseGoEDuration(durationStr: string): number {
    // Konvertiere "03:03:24" zu Minuten
    const [hours, minutes, seconds] = durationStr.split(':').map(Number)
    return hours * 60 + minutes + seconds / 60
  }

  async getCurrentSession() {
    return this.request('/api/current_session')
  }

  async getEnergy() {
    return this.request('/api/energy')
  }
} 