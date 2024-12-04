'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { 
  Battery, 
  Zap, 
  Calendar,
  TrendingUp,
  RefreshCw,
  FileText,
  Settings,
  Plus
} from 'lucide-react'
import Link from 'next/link'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'

type DashboardData = {
  totalEnergy: number
  totalCost: number
  activeChargers: number
  lastSync: string | null
  recentSessions: Array<{
    date: string
    energy: number
    cost: number
  }>
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const { toast } = useToast()

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/dashboard')
      if (!response.ok) throw new Error('Laden fehlgeschlagen')
      const dashboardData = await response.json()
      setData(dashboardData)
    } catch (error: unknown) {
      toast({
        variant: "destructive",
        title: "Fehler",
        description: "Dashboard konnte nicht geladen werden",
      })
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [toast])

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
        description: "Daten wurden synchronisiert",
      })

      await loadDashboardData()
    } catch (error: unknown) {
      toast({
        variant: "destructive",
        title: "Fehler",
        description: error instanceof Error ? error.message : 'Ein unbekannter Fehler ist aufgetreten',
      })
    } finally {
      setIsSyncing(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  const quickActions = [
    {
      title: "Wallbox hinzufügen",
      icon: Plus,
      href: "/dashboard/wallboxes",
      color: "text-green-500",
      description: "Neue Wallbox verbinden"
    },
    {
      title: "Berichte",
      icon: FileText,
      href: "/dashboard/reports",
      color: "text-blue-500",
      description: "Ladeberichte ansehen"
    },
    {
      title: "Einstellungen",
      icon: Settings,
      href: "/dashboard/settings",
      color: "text-orange-500",
      description: "Tarife verwalten"
    },
  ]

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-medium">Dashboard</h1>
        <Button 
          onClick={handleSync} 
          disabled={isSyncing}
          className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing && "animate-spin"}`} />
          Synchronisieren
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Statistik-Karten */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Aktive Wallboxen
                </CardTitle>
                <Battery className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data?.activeChargers || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Zuletzt aktualisiert: {data?.lastSync ? format(new Date(data.lastSync), 'PPp', { locale: de }) : 'Nie'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Gesamtenergie
                </CardTitle>
                <Zap className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data?.totalEnergy.toFixed(2)} kWh
                </div>
                <p className="text-xs text-muted-foreground">
                  Alle Ladevorgänge
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Gesamtkosten
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data?.totalCost.toFixed(2)} €
                </div>
                <p className="text-xs text-muted-foreground">
                  Alle Ladevorgänge
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Letzte 7 Tage
                </CardTitle>
                <Calendar className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data?.recentSessions.reduce((sum, session) => sum + session.energy, 0).toFixed(2)} kWh
                </div>
                <p className="text-xs text-muted-foreground">
                  {data?.recentSessions.reduce((sum, session) => sum + session.cost, 0).toFixed(2)} €
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Schnellaktionen */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {quickActions.map((action) => (
              <Link key={action.title} href={action.href}>
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">
                      {action.title}
                    </CardTitle>
                    <action.icon className={`h-4 w-4 ${action.color}`} />
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {action.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* Verbrauchsgraph */}
          <Card>
            <CardHeader>
              <CardTitle>Energieverbrauch (7 Tage)</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data?.recentSessions}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date"
                    tickFormatter={(date) => format(new Date(date), 'd. MMM', { locale: de })}
                  />
                  <YAxis 
                    tickFormatter={(value) => `${value} kWh`}
                  />
                  <Tooltip
                    formatter={(value: number) => [`${value} kWh`, 'Energie']}
                    labelFormatter={(date) => format(new Date(date), 'PPP', { locale: de })}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="energy" 
                    stroke="#0071e3" 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
} 