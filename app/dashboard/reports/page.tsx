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
  FileText
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
import { format, differenceInMinutes, startOfDay, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'
import { formatInTimeZone } from 'date-fns-tz'
import { cn } from '@/lib/utils'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface DidDrawPageData {
  pageNumber: number;
  pageCount: number;
}

type ChargingSession = {
  id: string
  wallbox_id: string
  start_time: string
  end_time: string
  energy_kwh: number
  cost: number
  tariff_name: string
  energy_rate: number
}

type DailyData = {
  date: string;
  energy: number;
  cost: number;
  sessions: number;
};

const PAGE_SIZES = [10, 20, 50, 100]

export default function ReportsPage() {
  const [sessions, setSessions] = useState<ChargingSession[]>([])
  const [loading, setLoading] = useState(true)
  const [dateFrom, setDateFrom] = useState(() => {
    const date = new Date()
    date.setMonth(date.getMonth() - 1)
    return format(date, 'yyyy-MM-dd')
  })
  const [dateTo, setDateTo] = useState(() => format(new Date(), 'yyyy-MM-dd'))
  const { toast } = useToast()
  const [isSyncing, setIsSyncing] = useState(false)
  const [pageSize, setPageSize] = useState(20)
  const [currentPage, setCurrentPage] = useState(0)

  const loadSessions = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/charging-sessions?from=${dateFrom}&to=${dateTo}`
      )
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
  }, [dateFrom, dateTo, toast])

  useEffect(() => {
    loadSessions()
  }, [loadSessions])

  const totalEnergy = sessions.reduce((sum, session) => sum + session.energy_kwh, 0)
  const totalCost = sessions.reduce((sum, session) => sum + session.cost, 0)

  const handleSync = async () => {
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

      // Lade die aktualisierten Daten
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
  }

  // Gruppiere die Daten nach Tagen für die Diagramme
  const dailyData = sessions.reduce<DailyData[]>((acc, session) => {
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

  // Sortiere und filtere die Sessions
  const sortedSessions = useMemo(() => {
    return [...sessions].sort((a, b) => 
      new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
    )
  }, [sessions])

  // Berechne die Gesamtanzahl der Seiten
  const totalPages = Math.ceil(sortedSessions.length / pageSize)

  // Hole die Sessions für die aktuelle Seite
  const currentSessions = sortedSessions.slice(
    currentPage * pageSize,
    (currentPage + 1) * pageSize
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

  const generatePDF = () => {
    const doc = new jsPDF()
    
    // Styling-Konstanten
    const primaryColor = [0, 113, 227]
    const textColor = [51, 51, 51]
    const secondaryColor = [128, 128, 128]
    
    // Header
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.rect(0, 0, doc.internal.pageSize.width, 40, 'F')
    
    // Logo & Titel
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(24)
    doc.text('EVSync', 14, 25)
    doc.setFontSize(12)
    doc.text('Ladebericht', 14, 35)
    
    // Zeitraum
    doc.setTextColor(textColor[0], textColor[1], textColor[2])
    doc.setFontSize(12)
    doc.text('Zeitraum:', 14, 55)
    const [r, g, b] = secondaryColor
    doc.setTextColor(r, g, b)
    doc.text(
      `${format(parseISO(dateFrom), 'PPP', { locale: de })} bis ${format(parseISO(dateTo), 'PPP', { locale: de })}`,
      45, 55
    )
    
    // Zusammenfassung Box
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.setLineWidth(0.1)
    doc.roundedRect(14, 65, 182, 40, 3, 3)
    
    // Zusammenfassung Titel
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.setFontSize(14)
    doc.text('Zusammenfassung', 20, 75)
    
    // Zusammenfassung Details
    doc.setFontSize(10)
    doc.setTextColor(textColor[0], textColor[1], textColor[2])
    const summaryData = [
      ['Gesamtenergie:', `${totalEnergy.toFixed(2)} kWh`],
      ['Gesamtkosten:', `${totalCost.toFixed(2)} €`],
      ['Anzahl Ladevorgänge:', `${sessions.length}`]
    ]
    
    let y = 85
    summaryData.forEach(([label, value]) => {
      doc.setTextColor(r, g, b)
      doc.text(label, 20, y)
      doc.setTextColor(textColor[0], textColor[1], textColor[2])
      doc.text(value, 80, y)
      y += 8
    })
    
    // Ladevorgänge Tabelle
    doc.setFontSize(14)
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.text('Ladevorgänge', 14, 120)
    
    // Tabellen-Styling mit angepassten Optionen
    const tableStyles = {
      headStyles: {
        fillColor: [0, 113, 227] as [number, number, number],
        textColor: [255, 255, 255] as [number, number, number],
        fontSize: 10,
        fontStyle: 'bold' as const,
      },
      bodyStyles: {
        textColor: [51, 51, 51] as [number, number, number],
        fontSize: 9,
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251] as [number, number, number],
      },
      columnStyles: {
        0: { cellWidth: 40 },  // Datum
        1: { cellWidth: 25 },  // Dauer
        2: { cellWidth: 30 },  // Energie
        3: { cellWidth: 55 },  // Tarif
        4: { cellWidth: 30, halign: 'right' as const },  // Kosten
      },
      margin: { top: 130 },
      startY: 130, // Fester Startpunkt für die erste Seite
      didDrawPage: function(data: DidDrawPageData) {
        // Setze den Header auf jeder neuen Seite
        if (data.pageNumber > 1) {
          doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
          doc.rect(0, 0, doc.internal.pageSize.width, 40, 'F')
          
          doc.setTextColor(255, 255, 255)
          doc.setFontSize(24)
          doc.text('EVSync', 14, 25)
          doc.setFontSize(12)
          doc.text('Ladebericht', 14, 35)
        }
        
        // Footer auf jeder Seite
        doc.setFontSize(8)
        doc.setTextColor(r, g, b)
        doc.text(
          `Erstellt am ${format(new Date(), 'PPp', { locale: de })} - Seite ${data.pageNumber} von ${data.pageCount}`,
          doc.internal.pageSize.width / 2,
          doc.internal.pageSize.height - 10,
          { align: 'center' }
        )
      },
      showHead: 'everyPage' as const,
      tableLineColor: [230, 230, 230] as [number, number, number],
      tableLineWidth: 0.1,
    }
    
    // Tabellendaten
    autoTable(doc, {
      head: [['Datum', 'Dauer', 'Energie', 'Tarif', 'Kosten']],
      body: sessions.map(session => {
        const startDate = parseISO(session.start_time)
        const endDate = parseISO(session.end_time)
        const duration = differenceInMinutes(endDate, startDate)
        const hours = Math.floor(duration / 60)
        const minutes = duration % 60

        return [
          format(startDate, 'Pp', { locale: de }),
          `${hours > 0 ? `${hours}h ` : ''}${minutes}min`,
          `${session.energy_kwh.toFixed(2)} kWh`,
          `${session.tariff_name}\n(${session.energy_rate.toFixed(2)} ct/kWh)`,
          `${session.cost.toFixed(2)} €`
        ]
      }),
      ...tableStyles,
    })
    
    // Speichern
    doc.save(`EVSync_Ladebericht_${dateFrom}_${dateTo}.pdf`)
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-medium">Ladeberichte</h1>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
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
            className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600"
          >
            <RefreshCw className={cn(
              "mr-2 h-4 w-4",
              isSyncing && "animate-spin"
            )} />
            Synchronisieren
          </Button>
        </div>
      </div>

      {/* Filter-Bereich */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="from">Von</Label>
              <Input
                type="date"
                id="from"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="grid w-full max-w-sm items-center gap-1.5">
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
            <div className="text-2xl font-bold">{totalEnergy.toFixed(2)} kWh</div>
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
            <div className="text-2xl font-bold">{totalCost.toFixed(2)} €</div>
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
            <div className="text-2xl font-bold">{sessions.length}</div>
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
        <CardHeader>
          <CardTitle>Ladevorgänge</CardTitle>
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
                      <TableHead>Datum</TableHead>
                      <TableHead>Dauer</TableHead>
                      <TableHead>Energie</TableHead>
                      <TableHead>Tarif</TableHead>
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
    </div>
  )
} 