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
    
    const status = await this.getStatus()
    if (!status.dll) {
      throw new Error('Kein Data-Link verfügbar')
    }

    // Extrahiere den e-Parameter aus der URL
    const url = new URL(status.dll)
    const token = url.searchParams.get('e')
    if (!token) {
      throw new Error('Kein Data-Token gefunden')
    }

    this.dataToken = token
    return token
  }

  async getStatus() {
    return this.request('/api/status')
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