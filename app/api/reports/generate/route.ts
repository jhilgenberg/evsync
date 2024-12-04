import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { format, parseISO, differenceInMinutes } from 'date-fns'
import { de } from 'date-fns/locale'

interface DidDrawPageData {
  pageNumber: number;
  pageCount: number;
}

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

    const { startDate, endDate } = await request.json()

    // Lade die Ladevorgänge
    const { data: sessions, error } = await supabase
      .from('charging_sessions')
      .select('*')
      .gte('start_time', startDate)
      .lte('end_time', endDate)
      .order('start_time', { ascending: false })

    if (error) throw error

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
      `${format(parseISO(startDate), 'PPP', { locale: de })} bis ${format(parseISO(endDate), 'PPP', { locale: de })}`,
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
    
    // Berechne Gesamtwerte
    const totalEnergy = sessions.reduce((sum, session) => sum + session.energy_kwh, 0)
    const totalCost = sessions.reduce((sum, session) => sum + session.cost, 0)
    
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
    
    // Tabellen-Styling
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
      startY: 130,
      didDrawPage: function(data: DidDrawPageData) {
        // Header auf jeder neuen Seite
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
    
    // Konvertiere PDF zu Base64
    const pdfBase64 = doc.output('datauristring')

    return NextResponse.json({ pdf: pdfBase64 })
  } catch (error) {
    console.error('PDF Generierung fehlgeschlagen:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unbekannter Fehler' },
      { status: 500 }
    )
  }
} 