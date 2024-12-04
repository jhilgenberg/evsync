import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

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
    const data = await request.json()

    // Validiere die Eingaben
    if (!data.manufacturer || !data.manufacturer.trim()) {
      return NextResponse.json(
        { error: 'Hersteller ist erforderlich' },
        { status: 400 }
      )
    }

    if (!data.email || !data.email.trim() || !data.email.includes('@')) {
      return NextResponse.json(
        { error: 'Gültige E-Mail ist erforderlich' },
        { status: 400 }
      )
    }

    // Speichere die Anfrage in der Datenbank
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    const { error: dbError } = await supabase
      .from('wallbox_requests')
      .insert({
        manufacturer: data.manufacturer.trim(),
        model: data.model?.trim() || null,
        email: data.email.trim(),
        status: 'new'
      })

    if (dbError) throw dbError

    // Sende die E-Mail
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: 'julian@hilgenberg.cc',
      subject: 'Neue Wallbox-Anfrage',
      html: `
        <h2>Neue Wallbox-Anfrage</h2>
        <p><strong>Hersteller:</strong> ${data.manufacturer}</p>
        <p><strong>Modell:</strong> ${data.model || 'Nicht angegeben'}</p>
        <p><strong>Kontakt:</strong> ${data.email}</p>
        <p><strong>Zeitpunkt:</strong> ${new Date().toLocaleString('de-DE')}</p>
      `
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Fehler beim Senden der Anfrage:', error)
    return NextResponse.json(
      { error: 'Fehler beim Senden der Anfrage' },
      { status: 500 }
    )
  }
} 