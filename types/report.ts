export type ReportSchedule = {
  id: string
  user_id: string
  wallbox_id: string
  frequency: 'daily' | 'weekly' | 'monthly'
  email: string
  active: boolean
  last_sent: string | null
  created_at: string
} 