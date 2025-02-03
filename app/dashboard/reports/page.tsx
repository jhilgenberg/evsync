'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { 
  RefreshCw, 
  Zap, 
  Battery, 
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  FileText,
  TrendingUp,
  TrendingDown,
  Settings,
  ChartArea
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Bar,
  ComposedChart,
  Legend,
} from 'recharts'
import { format, startOfDay, parseISO, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { de } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { ScheduleReportDialog } from './components/schedule-report-dialog'
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { WallboxConnection, Car } from '@/types/wallbox'
import { AssignCarDialog } from './components/assign-car-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { DataTable } from './components/data-table'
import { ChargingSession, createColumns } from './components/columns'

type DailyData = {
  date: string;
  energy: number;
  cost: number;
  sessions: number;
};

const PAGE_SIZES = [5, 10, 20, 50, 100]

// Konstante für "keine Auswahl"
const NO_SELECTION = 'none';

export default function ReportsPage() {
  const [sessions, setSessions] = useState<ChargingSession[]>([])
  const [cars, setCars] = useState<Car[]>([])
  const [selectedCar, setSelectedCar] = useState<string | undefined>()
  const [selectedSessions, setSelectedSessions] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [dateFrom, setDateFrom] = useState(() => {
    const date = new Date()
    date.setMonth(date.getMonth() - 1)
    return format(date, 'yyyy-MM-dd')
  })
  const [dateTo, setDateTo] = useState(() => format(new Date(), 'yyyy-MM-dd'))
  const { toast } = useToast()
  const [isSyncing, setIsSyncing] = useState(false)
  const [pageSize, setPageSize] = useState(5)
  const [currentPage, setCurrentPage] = useState(0)
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(() => format(new Date(), 'yyyy-MM'))
  const [isCustomRange, setIsCustomRange] = useState(false)
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [data, setData] = useState<ChargingSession[]>([])

  // Filtere die Sessions basierend auf dem ausgewählten Zeitraum
  const filteredSessions = useMemo(() => {
    return sessions.filter(session => {
      const sessionDate = new Date(session.start_time)
      const from = isCustomRange 
        ? new Date(dateFrom) 
        : startOfMonth(new Date(selectedMonth))
      const to = isCustomRange
        ? new Date(dateTo)
        : endOfMonth(new Date(selectedMonth))
      
      // Setze die Uhrzeiten für korrekten Vergleich
      from.setHours(0, 0, 0, 0)
      to.setHours(23, 59, 59, 999)
      
      return sessionDate >= from && sessionDate <= to
    })
  }, [sessions, dateFrom, dateTo, selectedMonth, isCustomRange])

  // Paginierung auf die gefilterten Daten anwenden
  const paginatedSessions = useMemo(() => {
    const start = currentPage * pageSize
    const end = start + pageSize
    return filteredSessions.slice(start, end)
  }, [filteredSessions, currentPage, pageSize])

  // Berechne die Gesamtanzahl der Seiten
  const totalPages = Math.ceil(filteredSessions.length / pageSize)

  // Setze die gefilterten und paginierten Daten für die DataTable
  useEffect(() => {
    setData(paginatedSessions)
  }, [paginatedSessions])

  // Aktualisiere die Seitenzahl wenn sich Filter ändern
  useEffect(() => {
    setCurrentPage(0)
  }, [dateFrom, dateTo, selectedMonth, isCustomRange, pageSize])

  // Statistiken basierend auf gefilterten Daten berechnen
  const stats = useMemo(() => {
    return filteredSessions.reduce((acc, session) => ({
      totalEnergy: acc.totalEnergy + Number(session.energy_kwh),
      totalCost: acc.totalCost + Number(session.cost),
      avgCost: 0,
      sessionCount: acc.sessionCount + 1
    }), {
      totalEnergy: 0,
      totalCost: 0,
      avgCost: 0,
      sessionCount: 0
    })
  }, [filteredSessions])

  // Chart-Daten basierend auf gefilterten Daten
  const chartData = useMemo(() => {
    const dailyData: Record<string, DailyData> = {}

    filteredSessions.forEach(session => {
      const date = format(new Date(session.start_time), 'yyyy-MM-dd')
      
      if (!dailyData[date]) {
        dailyData[date] = {
          date,
          energy: 0,
          cost: 0,
          sessions: 0
        }
      }

      dailyData[date].energy += Number(session.energy_kwh)
      dailyData[date].cost += Number(session.cost)
      dailyData[date].sessions += 1
    })

    return Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date))
  }, [filteredSessions])

  const loadSessions = useCallback(async () => {
    try {
      setLoading(true)
      console.log('Fetching sessions...')
      
      const url = `/api/charging-sessions${selectedCar && selectedCar !== NO_SELECTION ? `?car_id=${selectedCar}` : ''}`
      console.log('Request URL:', url)
      
      const response = await fetch(url)
      console.log('Response status:', response.status)
      
      if (!response.ok) throw new Error('Laden fehlgeschlagen')
      
      const data = await response.json()
      console.log('API Response:', data)

      if (!data.sessions) {
        console.log('No sessions in response')
        setSessions([])
        setData([])
        return
      }

      console.log('Setting sessions:', data.sessions.length)
      setSessions(data.sessions)
      setData(data.sessions)
    } catch (error: unknown) {
      console.error('Fehler beim Laden der Ladevorgänge:', error)
      toast({
        variant: "destructive",
        title: "Fehler",
        description: "Ladevorgänge konnten nicht geladen werden",
      })
      setSessions([])
      setData([])
    } finally {
      setLoading(false)
    }
  }, [selectedCar, toast])

  const loadCars = useCallback(async () => {
    try {
      const response = await fetch('/api/cars')
      if (!response.ok) throw new Error('Laden fehlgeschlagen')
      const data = await response.json()
      setCars(data.cars)
    } catch (error: unknown) {
      toast({
        variant: "destructive",
        title: "Fehler",
        description: "Autos konnten nicht geladen werden",
      })
      console.error(error)
    }
  }, [toast])

  useEffect(() => {
    loadSessions()
    loadCars()
  }, [loadSessions, loadCars])

  const handleSync = useCallback(async () => {
    try {
      setIsSyncing(true)
      const response = await fetch('/api/charging-sessions/sync', {
        method: 'POST',
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error)
      }

      toast({
        title: "Erfolg",
        description: "Ladevorgänge wurden synchronisiert",
      })

      await loadSessions()
    } catch (error: unknown) {
      toast({
        variant: "destructive",
        title: "Fehler",
        description: error instanceof Error ? error.message : 'Fehler beim Synchronisieren',
      })
      console.error(error)
    } finally {
      setIsSyncing(false)
    }
  }, [loadSessions, toast])

  // Prüfe und starte Sync wenn nötig
  useEffect(() => {
    const checkAndSync = async () => {
      try {
        // Hole den letzten Sync-Zeitpunkt aller Wallboxen
        const response = await fetch('/api/wallboxes')
        if (!response.ok) throw new Error('Laden der Wallboxen fehlgeschlagen')
        const wallboxes = await response.json()

        // Prüfe ob ein Sync nötig ist
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000)
        const needsSync = wallboxes.some((wallbox: WallboxConnection) => {
          const lastSync = wallbox.last_sync ? new Date(wallbox.last_sync) : new Date(0)
          return lastSync < fifteenMinutesAgo
        })

        if (needsSync && !isSyncing) {
          await handleSync()
        }
      } catch (error) {
        console.error('Auto-Sync Check fehlgeschlagen:', error)
      }
    }

    checkAndSync()
  }, [handleSync, isSyncing])

  // Prüfe ob alle sichtbaren Sessions ausgewählt sind
  const areAllVisibleSelected = paginatedSessions.every(session => 
    selectedSessions.has(session.id)
  )

  // Navigations-Funktionen
  const nextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages - 1))
  const prevPage = () => setCurrentPage(prev => Math.max(prev - 1, 0))
  const firstPage = () => setCurrentPage(0)
  const lastPage = () => setCurrentPage(totalPages - 1)

  // Reset Pagination wenn sich die Filterdaten ändern
  useEffect(() => {
    setCurrentPage(0)
  }, [dateFrom, dateTo])

  const generatePDF = async () => {
    try {
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: dateFrom,
          endDate: dateTo,
          carId: selectedCar === NO_SELECTION ? null : selectedCar
        })
      })

      if (!response.ok) {
        throw new Error('PDF Generierung fehlgeschlagen')
      }

      const { pdf } = await response.json()

      // Erstelle einen temporären Link zum Herunterladen
      const link = document.createElement('a')
      link.href = pdf
      link.download = `EVSync_Ladebericht_${dateFrom}_${dateTo}${selectedCar ? '_' + selectedCar : ''}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

    } catch (error) {
      toast({
        variant: "destructive",
        title: "Fehler",
        description: "PDF konnte nicht generiert werden",
      })
      console.error(error)
    }
  }

  // Aktualisiere dateFrom und dateTo wenn sich der Monat ändert
  useEffect(() => {
    const date = new Date(selectedMonth)
    setDateFrom(format(startOfMonth(date), 'yyyy-MM-dd'))
    setDateTo(format(endOfMonth(date), 'yyyy-MM-dd'))
  }, [selectedMonth])

  // Berechne Statistiken für den aktuellen und vorherigen Zeitraum
  const statistics = useMemo(() => {
    const currentStart = new Date(dateFrom)
    const currentEnd = new Date(dateTo)
    const duration = currentEnd.getTime() - currentStart.getTime()
    
    // Berechne den vorherigen Zeitraum
    const previousStart = new Date(currentStart.getTime() - duration)
    const previousEnd = new Date(currentStart)
    
    // Filtere Sessions für beide Zeitrume
    const currentSessions = sessions.filter(session => {
      const date = new Date(session.start_time)
      return date >= currentStart && date <= currentEnd
    })
    
    const previousSessions = sessions.filter(session => {
      const date = new Date(session.start_time)
      return date >= previousStart && date < previousEnd
    })

    // Berechne Summen
    const current = {
      energy: currentSessions.reduce((sum, s) => sum + s.energy_kwh, 0),
      cost: currentSessions.reduce((sum, s) => sum + s.cost, 0),
      count: currentSessions.length
    }

    const previous = {
      energy: previousSessions.reduce((sum, s) => sum + s.energy_kwh, 0),
      cost: previousSessions.reduce((sum, s) => sum + s.cost, 0),
      count: previousSessions.length
    }

    // Berechne Änderungen in Prozent
    const calculateChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0
      return ((current - previous) / previous) * 100
    }

    return {
      energy: {
        value: current.energy,
        change: calculateChange(current.energy, previous.energy)
      },
      cost: {
        value: current.cost,
        change: calculateChange(current.cost, previous.cost)
      },
      sessions: {
        value: current.count,
        change: calculateChange(current.count, previous.count)
      }
    }
  }, [sessions, dateFrom, dateTo])

  // Komponente für den Trend-Indikator
  const TrendIndicator = ({ change }: { change: number }) => {
    if (change === 0) return null
    const isPositive = change > 0
    return (
      <div className={cn(
        "flex items-center text-sm",
        isPositive ? "text-green-500" : "text-red-500"
      )}>
        {isPositive ? (
          <TrendingUp className="h-4 w-4 mr-1" />
        ) : (
          <TrendingDown className="h-4 w-4 mr-1" />
        )}
        {Math.abs(change).toFixed(1)}%
      </div>
    )
  }

  const assignCar = async (sessionIds: string[], carId: string) => {
    try {
      const response = await fetch('/api/charging-sessions/assign-car', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionIds, carId }),
      })

      if (!response.ok) throw new Error('Zuweisung fehlgeschlagen')

      // Aktualisiere nur die betroffenen Sessions im State
      setSessions(prevSessions => 
        prevSessions.map(session => 
          sessionIds.includes(session.id) 
            ? { ...session, car_id: carId }
            : session
        )
      )

      toast({
        title: "Erfolg",
        description: "Auto wurde zugewiesen"
      })
    } catch (error) {
      console.error('Fehler bei der Zuweisung:', error)
      toast({
        variant: "destructive",
        title: "Fehler",
        description: "Auto konnte nicht zugewiesen werden"
      })
      throw error
    }
  }

  const toggleSessionSelection = (sessionId: string) => {
    setSelectedSessions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sessionId)) {
        newSet.delete(sessionId);
      } else {
        newSet.add(sessionId);
      }
      return newSet;
    });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Hauptnavigation */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div className="flex items-center space-x-2">
          <h1 className="text-3xl font-medium">Ladeberichte</h1>
          <div className="flex items-center space-x-2 ml-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const date = new Date(selectedMonth)
                setSelectedMonth(format(subMonths(date, 1), 'yyyy-MM'))
              }}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 py-1"
            >
              {Array.from({ length: 12 }, (_, i) => {
                const date = subMonths(new Date(), i)
                const value = format(date, 'yyyy-MM')
                return (
                  <option key={value} value={value}>
                    {format(date, 'MMMM yyyy', { locale: de })}
                  </option>
                )
              })}
            </select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const today = new Date()
                setSelectedMonth(format(today, 'yyyy-MM'))
              }}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={selectedCar || NO_SELECTION}
            onValueChange={(value) => setSelectedCar(value === NO_SELECTION ? undefined : value)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Alle Autos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_SELECTION}>Alle Autos</SelectItem>
              {cars.map((car) => (
                <SelectItem key={car.id} value={car.id}>
                  {car.make} {car.model}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Settings className="mr-2 h-4 w-4" />
                Filter & Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[300px] p-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Zeitraum</Label>
                  <Tabs defaultValue="month" onValueChange={(value) => setIsCustomRange(value === 'custom')}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="month">Monat</TabsTrigger>
                      <TabsTrigger value="custom">Benutzerdefiniert</TabsTrigger>
                    </TabsList>
                  </Tabs>
                  
                  {isCustomRange && (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div className="space-y-1">
                        <Label htmlFor="from">Von</Label>
                        <Input
                          type="date"
                          id="from"
                          value={dateFrom}
                          onChange={(e) => setDateFrom(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="to">Bis</Label>
                        <Input
                          type="date"
                          id="to"
                          value={dateTo}
                          onChange={(e) => setDateTo(e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Export</Label>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={generatePDF}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Als PDF exportieren
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label>Automatisierung</Label>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setScheduleDialogOpen(true)}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    Bericht planen
                  </Button>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button 
            onClick={handleSync} 
            disabled={isSyncing}
            className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600"
          >
            <RefreshCw className={cn(
              "mr-2 h-4 w-4",
              isSyncing && "animate-spin"
            )} />
            Sync
          </Button>
        </div>
      </div>

      {/* Statistik-Karten */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Gesamtenergie
            </CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalEnergy.toFixed(2)} kWh
            </div>
            <TrendIndicator change={statistics.energy.change} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Gesamtkosten
            </CardTitle>
            <Battery className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalCost.toFixed(2)} €
            </div>
            <TrendIndicator change={statistics.cost.change} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ladevorgänge
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.sessions.value}</div>
            <TrendIndicator change={statistics.sessions.change} />
          </CardContent>
        </Card>
      </div>

      {/* Diagramme */}
      <div className="w-full">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center space-x-2">
              <ChartArea className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Energie & Kosten</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="h-[500px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date"
                  tickFormatter={(date) => format(new Date(date), 'd. MMM', { locale: de })}
                  className="text-muted-foreground text-xs"
                />
                <YAxis 
                  yAxisId="left"
                  tickFormatter={(value) => `${value.toFixed(1)} kWh`}
                  className="text-muted-foreground text-xs"
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  tickFormatter={(value) => `${value.toFixed(2)} €`}
                  className="text-muted-foreground text-xs"
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload || !payload.length) return null;
                    
                    return (
                      <div className="rounded-lg border bg-popover p-2 shadow-sm">
                        <div className="text-sm text-popover-foreground">
                          {format(parseISO(label), 'PPP', { locale: de })}
                        </div>
                        {payload.map((entry) => (
                          <div key={entry.dataKey} className="text-sm font-medium text-popover-foreground">
                            {entry.name}: {entry.value != null ? Number(entry.value).toFixed(2) : '0.00'} {entry.dataKey === 'energy' ? 'kWh' : '€'}
                          </div>
                        ))}
                      </div>
                    );
                  }}
                />
                <Legend />
                <Bar 
                  dataKey="energy" 
                  fill="#0071e3" 
                  yAxisId="left"
                  name="Energie"
                  opacity={0.8}
                />
                <Line 
                  type="monotone" 
                  dataKey="cost" 
                  stroke="#10b981" 
                  yAxisId="right"
                  name="Kosten"
                  dot={false}
                  strokeWidth={2}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tabelle */}
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Ladevorgänge</CardTitle>
          {selectedSessions.size > 0 && (
            <Button
              variant="outline"
              onClick={() => setIsAssignDialogOpen(true)}
            >
              Ausgewählte zuweisen
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <DataTable 
                  columns={createColumns(
                    cars,
                    assignCar
                  )} 
                  data={data}
                  onRowSelectionChange={(selectedRows) => {
                    setSelectedSessions(new Set(selectedRows))
                  }}
                />
              </div>

              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center space-x-2">
                  <Label>Zeilen pro Seite:</Label>
                  <select
                    className="h-9 rounded-md border border-input bg-background px-3 py-1"
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value))
                      setCurrentPage(0)
                    }}
                  >
                    {PAGE_SIZES.map(size => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                  <span className="text-sm text-muted-foreground">
                    Seite {currentPage + 1} von {totalPages}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={firstPage}
                    disabled={currentPage === 0}
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={prevPage}
                    disabled={currentPage === 0}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={nextPage}
                    disabled={currentPage === totalPages - 1}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={lastPage}
                    disabled={currentPage === totalPages - 1}
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <ScheduleReportDialog 
        open={scheduleDialogOpen} 
        onOpenChange={setScheduleDialogOpen}
      />

      <AssignCarDialog
        open={isAssignDialogOpen}
        onOpenChange={setIsAssignDialogOpen}
        sessionIds={Array.from(selectedSessions)}
        cars={cars}
        onAssign={assignCar}
      />
    </div>
  )
} 