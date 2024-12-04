export type GoEStatus = {
  car: number              // Fahrzeugstatus (0: nicht verbunden, 1: verbunden, 2: lädt)
  nrg: number[]           // Aktuelle Leistungswerte [Spannung L1, L2, L3, Strom L1, L2, L3, ...]
  wh: number              // Geladene Energie in Wh
  alw: boolean           // Laden erlaubt
  acu: number            // Aktueller Ladestrom
  err: number            // Fehlercode
  cbl: number            // Kabelkapazität in Ampere
  pha: boolean[]         // Phasenstatus
  tmp: number[]          // Temperaturen
  fwv: string           // Firmware Version
  tma?: number[]        // Temperaturmesswerte
  wst: number           // WiFi Status
  dll?: string          // Data Link für Ladevorgänge
  ccw?: {
    ssid: string
    ip: string
  }
} 