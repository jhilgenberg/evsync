import { createClient } from '@supabase/supabase-js'
import { createWallboxService } from './wallbox/factory'
import { CostCalculator } from './cost-calculator'
import { EncryptionService } from './encryption'

export class SyncService {
  private supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  async syncAllWallboxes() {
    try {
      const { data: connections, error } = await this.supabase
        .from('wallbox_connections')
        .select('*')

      if (error) throw error

      for (const connection of connections) {
        await this.syncWallbox(connection)
      }
    } catch (error) {
      console.error('Sync all wallboxes error:', error)
    }
  }

  private async syncWallbox(connection: any) {
    try {
      // Hole die Tarife des Benutzers
      const { data: tariffs } = await this.supabase
        .from('electricity_tariffs')
        .select('*')
        .eq('user_id', connection.user_id)
        .order('valid_from', { ascending: false })

      const costCalculator = new CostCalculator(tariffs || [])

      // Erstelle den Service mit entschlüsselter Konfiguration
      const service = createWallboxService(connection)

      const { data: lastSession } = await this.supabase
        .from('charging_sessions')
        .select('end_time')
        .eq('wallbox_id', connection.id)
        .order('end_time', { ascending: false })
        .limit(1)
        .single()

      const to = new Date()
      const from = lastSession?.end_time 
        ? new Date(lastSession.end_time)
        : new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000)

      const sessions = await service.getChargingSessions(from, to)
      
      // Berechne die Kosten für jeden Ladevorgang
      const sessionsWithCosts = sessions.map((session: any) => {
        const startTime = new Date(session.start_time)
        const endTime = new Date(session.end_time)
        const energyKwh = session.energy / 1000

        const { cost, tariff } = costCalculator.calculateSessionCost(
          startTime,
          energyKwh
        )

        return {
          wallbox_id: connection.id,
          user_id: connection.user_id,
          session_id: session.id,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          energy_kwh: energyKwh,
          cost: Number(cost.toFixed(2)),
          tariff_id: tariff?.id || null,
          tariff_name: tariff?.name || null,
          energy_rate: tariff?.energy_rate || null,
          raw_data: session
        }
      })

      await this.supabase
        .from('charging_sessions')
        .upsert(sessionsWithCosts, {
          onConflict: 'wallbox_id,session_id',
          ignoreDuplicates: false // Überschreibe existierende Einträge
        })

      await this.supabase
        .from('wallbox_connections')
        .update({ last_sync: new Date().toISOString() })
        .eq('id', connection.id)

    } catch (error) {
      console.error(`Sync error for wallbox ${connection.id}:`, error)
    }
  }
} 