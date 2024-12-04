import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { format, parseISO, differenceInMinutes } from 'date-fns'
import { de } from 'date-fns/locale'

type didPageDraw = {
  pageNumber: number
  pageCount: number
  settings: {
    margin: { top: number }
  }
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

    const colors: { [key: string]: [number, number, number] } = {
      primary: [0, 113, 227],
      secondary: [124, 58, 237],
      text: [51, 51, 51],
      muted: [128, 128, 128],
      white: [255, 255, 255]
    }

    const doc = new jsPDF()
    
    // Header mit Gradient
    doc.setFillColor(...colors.primary)
    doc.rect(0, 0, doc.internal.pageSize.width, 35, 'F')
    
    // Logo & Titel
    doc.setTextColor(...colors.white)
    doc.setFontSize(24)
    doc.setFont('helvetica', 'bold' as const)
    doc.text('EVSync', 15, 20)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal' as const)
    doc.text('Ladebericht', 15, 30)

    // Zeitraum Box mit abgerundeten Ecken
    doc.setDrawColor(...colors.primary)
    doc.setLineWidth(0.5)
    doc.roundedRect(15, 45, doc.internal.pageSize.width - 30, 20, 3, 3)
    
    doc.setTextColor(...colors.text)
    doc.setFontSize(10)
    doc.text('Zeitraum:', 20, 57)
    doc.setTextColor(...colors.muted)
    doc.text(
      `${format(parseISO(startDate), 'PPP', { locale: de })} bis ${format(parseISO(endDate), 'PPP', { locale: de })}`,
      60, 57
    )

    // Zusammenfassung mit modernem Design
    doc.setFillColor(245, 247, 250) // Helles Grau für Box
    doc.roundedRect(15, 75, doc.internal.pageSize.width - 30, 45, 3, 3, 'F')
    
    doc.setTextColor(...colors.primary)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold' as const)
    doc.text('Zusammenfassung', 20, 87)
    
    // Berechne Gesamtwerte
    const totalEnergy = sessions.reduce((sum, session) => sum + session.energy_kwh, 0)
    const totalCost = sessions.reduce((sum, session) => sum + session.cost, 0)
    
    // Info-Karten Layout
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    const summaryData = [
      { label: 'Gesamtenergie:', value: `${totalEnergy.toFixed(2)} kWh` },
      { label: 'Gesamtkosten:', value: `${totalCost.toFixed(2)} €` },
      { label: 'Anzahl Ladevorgänge:', value: `${sessions.length}` }
    ]
    
    let y = 100
    summaryData.forEach(({ label, value }) => {
      doc.setTextColor(...colors.muted)
      doc.text(label, 20, y)
      doc.setTextColor(...colors.text)
      doc.setFont('helvetica', 'bold' as const)
      doc.text(value, 100, y)
      doc.setFont('helvetica', 'normal')
      y += 8
    })

    // Ladevorgänge Tabelle mit modernem Design
    doc.setTextColor(...colors.primary)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold' as const)
    doc.text('Ladevorgänge', 15, 130)
    
    // Tabellen-Styling
    const tableStyles = {
      headStyles: {
        fillColor: colors.primary,
        textColor: colors.white,
        fontSize: 10,
        fontStyle: 'bold' as const,
        lineWidth: 0,
      },
      bodyStyles: {
        textColor: colors.text,
        fontSize: 8,
        fontStyle: 'normal' as const,
        lineWidth: 0,
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250] as [number, number, number],
      },
      columnStyles: {
        0: { cellWidth: 35 },  // Datum - schmaler
        1: { cellWidth: 20 },  // Dauer - schmaler
        2: { cellWidth: 25 },  // Energie - schmaler
        3: { cellWidth: 45 },  // Tarif - breiter
        4: { cellWidth: 25, halign: 'right' as const }, // Kosten - schmaler
      },
      startY: 135,
      margin: { left: 15, right: 15, bottom: 15 },
      rowPageBreak: 'auto' as const,  // Verhindert Seitenumbrüche innerhalb von Zeilen
      showFoot: 'lastPage' as const,   // Zeigt die Fußzeile nur auf der letzten Seite
      tableLineColor: [230, 230, 230] as [number, number, number],
      tableLineWidth: 0.1,    // Feinere Linien
      didDrawPage: function(data: didPageDraw) {
        // Setze die Startposition für die nächste Seite
        if (data.pageNumber > 1) {
          data.settings.margin.top = 15  // Minimaler Abstand zum oberen Rand
        }

        // Footer auf jeder Seite
        doc.setFontSize(7)
        doc.setTextColor(...colors.muted)
        doc.text(
          `EVSync - Seite ${data.pageNumber} von ${data.pageCount}`,
          doc.internal.pageSize.width / 2,
          doc.internal.pageSize.height - 8,
          { align: 'center' }
        )
      }
    }
    
    // Tabellendaten mit verbessertem Layout
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