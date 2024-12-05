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
  Download,
  FileText,
  TrendingUp,
  TrendingDown
} from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts'
import { format, differenceInMinutes, startOfDay, parseISO, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { de } from 'date-fns/locale'
import { formatInTimeZone } from 'date-fns-tz'
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

type ChargingSession = {
  id: string
  wallbox_id: string
  start_time: string
  end_time: string
  energy_kwh: number
  cost: number
  tariff_name: string
  energy_rate: number
  car_id: string | null
}

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

  const loadSessions = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/charging-sessions${selectedCar && selectedCar !== NO_SELECTION ? `?car_id=${selectedCar}` : ''}`)
      if (!response.ok) throw new Error('Laden fehlgeschlagen')
      const data = await response.json()
      setSessions(data)
    } catch (error: unknown) {
      toast({
        variant: "destructive",
        title: "Fehler",
        description: "Ladevorgänge konnten nicht geladen werden",
      })
      console.error(error)
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

  // Sortiere und filtere die Sessions
  const sortedSessions = useMemo(() => {
    // Filtere zuerst nach dem ausgewählten Zeitraum
    const filteredSessions = sessions.filter(session => {
      const sessionDate = new Date(session.start_time)
      const start = new Date(dateFrom)
      const end = new Date(dateTo)
      return sessionDate >= start && sessionDate <= end
    })

    // Dann sortiere die gefilterten Sessions
    return [...filteredSessions].sort((a, b) => 
      new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
    )
  }, [sessions, dateFrom, dateTo])

  // Gruppiere die Daten nach Tagen für die Diagramme
  const dailyData = useMemo(() => {
    return sortedSessions.reduce<DailyData[]>((acc, session) => {
      const date = startOfDay(new Date(session.start_time));
      const dateStr = format(date, 'yyyy-MM-dd');
      
      const existingDay = acc.find(d => d.date === dateStr);
      if (existingDay) {
        existingDay.energy += session.energy_kwh;
        existingDay.cost += session.cost;
        existingDay.sessions += 1;
      } else {
        acc.push({
          date: dateStr,
          energy: session.energy_kwh,
          cost: session.cost,
          sessions: 1,
        });
      }
      return acc;
    }, []).sort((a, b) => a.date.localeCompare(b.date));
  }, [sortedSessions])

  // Berechne die Gesamtanzahl der Seiten basierend auf den gefilterten Sessions
  const totalPages = Math.ceil(sortedSessions.length / pageSize)

  // Hole die Sessions für die aktuelle Seite
  const currentSessions = sortedSessions.slice(
    currentPage * pageSize,
    (currentPage + 1) * pageSize
  )

  // Prüfe ob alle sichtbaren Sessions ausgewählt sind
  const areAllVisibleSelected = currentSessions.every(session => 
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
          endDate: dateTo
        })
      })

      if (!response.ok) {
        throw new Error('PDF Generierung fehlgeschlagen')
      }

      const { pdf } = await response.json()

      // Erstelle einen temporären Link zum Herunterladen
      const link = document.createElement('a')
      link.href = pdf
      link.download = `EVSync_Ladebericht_${dateFrom}_${dateTo}.pdf`
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

  const handleAssignCar = async (sessionIds: string[], carId: string) => {
    // Optimistisches Update der UI
    const updatedSessions = sessions.map(session => {
      if (sessionIds.includes(session.id)) {
        return {
          ...session,
          car_id: carId === NO_SELECTION ? null : carId
        };
      }
      return session;
    }) as ChargingSession[];
    
    // Sofort UI aktualisieren
    setSessions(updatedSessions);
    
    // Optional: Auswahl zurücksetzen
    setSelectedSessions(new Set());
    
    try {
      const response = await fetch('/api/charging-sessions/bulk-assign', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          session_ids: sessionIds, 
          car_id: carId === NO_SELECTION ? null : carId
        }),
      });

      if (!response.ok) {
        // Bei Fehler zurück zu original Zustand
        setSessions(sessions);
        const data = await response.json();
        throw new Error(data.error);
      }

      // Aktualisiere die UI mit den Daten vom Server
      const data = await response.json();
      
      // Aktualisiere nur die geänderten Sessions
      setSessions(prev => prev.map(session => {
        const updatedSession = data.find((d: ChargingSession) => d.id === session.id);
        return updatedSession || session;
      }));

      toast({
        title: "Erfolg",
        description: "Auto wurde zugewiesen",
      });
    } catch (error) {
      // UI-State wurde bereits zurückgesetzt
      toast({
        variant: "destructive",
        title: "Fehler",
        description: "Auto konnte nicht zugewiesen werden",
      });
      console.error(error);
    }
  };

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
      <div className="flex justify-between items-center sm:flex-row flex-col">
        <h1 className="text-3xl font-medium">Ladeberichte</h1>
        <div className="flex flex-wrap gap-2 sm:pt-0 pt-4">
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
          <Button 
            variant="outline"
            onClick={() => setScheduleDialogOpen(true)}
            className="w-full sm:w-auto"
          >
            <Calendar className="mr-2 h-4 w-4" />
            Automatisieren
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={generatePDF}>
                <FileText className="mr-2 h-4 w-4" />
                Als PDF speichern
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button 
            onClick={handleSync} 
            disabled={isSyncing}
            className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600"
          >
            <RefreshCw className={cn(
              "mr-0 sm:mr-2 h-4 w-4",
              isSyncing && "animate-spin"
            )} />
            <span className="sm:inline">Synchronisieren</span>
          </Button>
        </div>
      </div>

      {/* Filter-Bereich */}
      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="month" onValueChange={(value) => setIsCustomRange(value === 'custom')}>
            <div className="flex flex-col space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="month">Monatsauswählen</TabsTrigger>
                <TabsTrigger value="custom">Benutzerdefiniert</TabsTrigger>
              </TabsList>

              <div className="space-y-4">
                {isCustomRange ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="from">Von</Label>
                      <Input
                        type="date"
                        id="from"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="to">Bis</Label>
                      <Input
                        type="date"
                        id="to"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="h-9"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="month">Monat auswählen</Label>
                        <Input
                          type="month"
                          id="month"
                          value={selectedMonth}
                          onChange={(e) => setSelectedMonth(e.target.value)}
                          className="h-9"
                        />
                      </div>
                      <div className="flex items-end space-x-2">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => {
                            const date = new Date(selectedMonth)
                            setSelectedMonth(format(subMonths(date, 1), 'yyyy-MM'))
                          }}
                        >
                          <ChevronLeft className="h-4 w-4 mr-2" />
                          Vorheriger
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => {
                            const today = new Date()
                            setSelectedMonth(format(today, 'yyyy-MM'))
                          }}
                        >
                          Aktuell
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>
                    Zeitraum: {format(parseISO(dateFrom), 'PPP', { locale: de })} bis{' '}
                    {format(parseISO(dateTo), 'PPP', { locale: de })}
                  </span>
                </div>
              </div>
            </div>
          </Tabs>
        </CardContent>
      </Card>

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
              {statistics.energy.value.toFixed(2)} kWh
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
              {statistics.cost.value.toFixed(2)} €
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Energieverbrauch</CardTitle>
          </CardHeader>
          <CardContent className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => format(new Date(date), 'd. MMM', { locale: de })}
                />
                <YAxis 
                  yAxisId="left"
                  tickFormatter={(value) => `${value.toFixed(1)} kWh`}
                />
                <Tooltip
                  formatter={(value: number) => [`${value.toFixed(2)} kWh`, 'Energie']}
                  labelFormatter={(date) => format(new Date(date), 'PPP', { locale: de })}
                />
                <Bar 
                  dataKey="energy" 
                  fill="#0071e3" 
                  yAxisId="left"
                  name="Energie"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Kostenentwicklung</CardTitle>
          </CardHeader>
          <CardContent className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date"
                  tickFormatter={(date) => format(new Date(date), 'd. MMM', { locale: de })}
                />
                <YAxis 
                  yAxisId="left"
                  tickFormatter={(value) => `${value.toFixed(2)} €`}
                />
                <Tooltip
                  formatter={(value: number) => [`${value.toFixed(2)} €`, 'Kosten']}
                  labelFormatter={(date) => format(new Date(date), 'PPP', { locale: de })}
                />
                <Line 
                  type="monotone" 
                  dataKey="cost" 
                  stroke="#0071e3" 
                  yAxisId="left"
                  name="Kosten"
                  dot={false}
                />
              </LineChart>
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
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>
                        <input
                          type="checkbox"
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedSessions(new Set(currentSessions.map((s) => s.id)));
                            } else {
                              setSelectedSessions(new Set());
                            }
                          }}
                          checked={areAllVisibleSelected && currentSessions.length > 0}
                        />
                      </TableHead>
                      <TableHead>Datum</TableHead>
                      <TableHead>Dauer</TableHead>
                      <TableHead>Energie</TableHead>
                      <TableHead>Tarif</TableHead>
                      <TableHead>Auto</TableHead>
                      <TableHead className="text-right">Kosten</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentSessions.map((session) => {
                      const startDate = parseISO(session.start_time)
                      const endDate = parseISO(session.end_time)
                      const duration = differenceInMinutes(endDate, startDate)
                      const hours = Math.floor(duration / 60)
                      const minutes = duration % 60

                      return (
                        <TableRow key={session.id} className="hover:bg-muted/50">
                          <TableCell>
                            <input
                              type="checkbox"
                              checked={selectedSessions.has(session.id)}
                              onChange={() => toggleSessionSelection(session.id)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatInTimeZone(startDate, 'Europe/Berlin', 'Pp', { locale: de })}
                          </TableCell>
                          <TableCell>
                            {hours > 0 ? `${hours}h ` : ''}{minutes}min
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Zap className="mr-2 h-4 w-4 text-blue-500" />
                              {session.energy_kwh.toFixed(2)} kWh
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span>{session.tariff_name}</span>
                              <span className="text-sm text-muted-foreground">
                                {session.energy_rate.toFixed(2)} ct/kWh
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={session.car_id || NO_SELECTION}
                              onValueChange={(value) => handleAssignCar([session.id], value === NO_SELECTION ? '' : value)}
                            >
                              <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Kein Auto" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value={NO_SELECTION}>Kein Auto</SelectItem>
                                {cars.map((car) => (
                                  <SelectItem key={car.id} value={car.id}>
                                    {car.make} {car.model}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {session.cost.toFixed(2)} €
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
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
        cars={cars}
        onAssign={async (carId) => {
          await handleAssignCar(Array.from(selectedSessions), carId);
        }}
      />
    </div>
  )
} 