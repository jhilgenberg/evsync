import { NextResponse } from 'next/server'
import { SyncService } from '@/services/sync-service'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    // Überprüfe den Authorization Header
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const syncService = new SyncService()
    await syncService.syncAllWallboxes()

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Cron sync error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
} 