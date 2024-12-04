import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function POST(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    // Hole alle aktiven Report-Schedules
    const { data: schedules, error: schedulesError } = await supabase
      .from('report_schedules')
      .select('*')
      .eq('active', true)

    if (schedulesError) throw schedulesError

    for (const schedule of schedules) {
      try {
        // Bestimme den Berichtszeitraum
        const now = new Date()
        let startDate: Date
        const endDate = endOfDay(now)

        switch (schedule.frequency) {
          case 'daily':
            startDate = startOfDay(subDays(now, 1))
            break
          case 'weekly':
            startDate = startOfDay(subDays(now, 7))
            break
          case 'monthly':
            startDate = startOfDay(subDays(now, 30))
            break
          default:
            continue
        }

        // Generiere PDF über den anderen Endpoint
        const pdfResponse = await fetch(new URL('/api/reports/generate', request.url).toString(), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // Übertrage die Auth-Cookies
            Cookie: cookieStore.toString()
          },
          body: JSON.stringify({
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
          })
        })

        if (!pdfResponse.ok) {
          throw new Error('PDF Generierung fehlgeschlagen')
        }

        const { pdf } = await pdfResponse.json()
        const period = schedule.frequency === 'daily' ? 'Tages' : 
                      schedule.frequency === 'weekly' ? 'Wochen' : 'Monats'

        // Sende E-Mail
        await transporter.sendMail({
          from: process.env.SMTP_FROM,
          to: session.user.email,
          subject: `Ihr ${period}bericht von EVSync`,
          html: `<p>Anbei finden Sie Ihren ${period}bericht von EVSync.</p>`,
          attachments: [{
            filename: `EVSync_Bericht_${format(new Date(), 'yyyy-MM-dd')}.pdf`,
            content: pdf.split('base64,')[1],
            encoding: 'base64'
          }]
        })

        // Aktualisiere last_sent
        await supabase
          .from('report_schedules')
          .update({ last_sent: now.toISOString() })
          .eq('id', schedule.id)

      } catch (error) {
        console.error(`Fehler beim Verarbeiten von Schedule ${schedule.id}:`, error)
        continue
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Fehler beim Senden der Berichte:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unbekannter Fehler' },
      { status: 500 }
    )
  }
} 