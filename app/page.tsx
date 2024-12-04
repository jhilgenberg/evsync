'use client'

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import { 
  Battery, 
  BarChart, 
  Mail,
  Cloud,
  LineChart,
  Wallet,
  Smartphone,
  Check,
  Plus
} from 'lucide-react'
import Image from 'next/image'
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"

const supportedWallboxes = [
  {
    name: "go-e",
    logo: "/logos/go-e.png",
    description: "go-e HOME+ und CHARGER"
  },
  // Weitere Wallboxen hier hinzufügen
]

const features = [
  {
    icon: Battery,
    title: "Wallbox Management",
    description: "Verwalten Sie all Ihre Wallboxen zentral in einer Anwendung, unabhängig vom Hersteller."
  },
  {
    icon: BarChart,
    title: "Detaillierte Berichte",
    description: "Analysieren Sie Ihren Ladeverbrauch mit übersichtlichen Grafiken und exportieren Sie Berichte als PDF."
  },
  {
    icon: Wallet,
    title: "Kostenübersicht",
    description: "Behalten Sie die Kosten im Blick mit automatischer Berechnung basierend auf Ihren Stromtarifen."
  },
  {
    icon: Mail,
    title: "Automatische Berichte",
    description: "Lassen Sie sich regelmäßig Berichte per E-Mail zusenden - täglich, wöchentlich oder monatlich."
  },
  {
    icon: Cloud,
    title: "Cloud-Synchronisation",
    description: "Ihre Daten sind sicher in der Cloud gespeichert und von überall zugänglich."
  },
  {
    icon: LineChart,
    title: "Trendanalysen",
    description: "Erkennen Sie Verbrauchsmuster und optimieren Sie Ihr Ladeverhalten."
  },
  {
    icon: Smartphone,
    title: "Mobil optimiert",
    description: "Nutzen Sie EVSync unterwegs auf Ihrem Smartphone oder Tablet."
  },
  {
    icon: Wallet,
    title: "Automatische Abrechnung",
    description: "Erstellen Sie automatisierte Abrechnungen für Ihren Arbeitgeber mit allen relevanten Ladevorgängen."
  }
]

export default function LandingPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData(e.currentTarget)
    const data = {
      manufacturer: formData.get('manufacturer'),
      model: formData.get('model'),
      email: formData.get('email'),
    }

    try {
      const response = await fetch('/api/wallbox-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) throw new Error()

      toast({
        title: "Anfrage gesendet",
        description: "Vielen Dank für Ihren Vorschlag!",
      })
      setShowDialog(false)
      
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Fehler",
        description: "Ihre Anfrage konnte nicht gesendet werden.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <header className="flex flex-col items-center justify-center px-4 py-24 text-center bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-background">
        <h1 className="text-4xl sm:text-6xl font-bold bg-gradient-to-r from-blue-600 via-blue-500 to-violet-500 bg-clip-text text-transparent">
          EVSync
        </h1>
        <p className="mt-4 text-xl text-muted-foreground max-w-2xl">
          Die zentrale Plattform für die Verwaltung Ihrer Wallboxen. 
          Überwachen, analysieren und optimieren Sie Ihr Ladeverhalten.
        </p>
        <div className="mt-8 flex gap-4">
          <Link href="/dashboard">
            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-blue-500">
              Jetzt starten
            </Button>
          </Link>
          <Link href="/dashboard/wallboxes">
            <Button size="lg" variant="outline">
              Demo ansehen
            </Button>
          </Link>
        </div>
      </header>

      {/* Features Grid */}
      <section className="py-20 px-4">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-3xl font-bold text-center mb-12">
            Alles was Sie brauchen
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="p-6 hover:shadow-lg transition-shadow">
                <feature.icon className="h-12 w-12 text-blue-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Neue Sektion: Unterstützte Wallboxen */}
      <section className="py-20 px-4 bg-muted/50">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-3xl font-bold text-center mb-4">
            Unterstützte Wallboxen
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            EVSync unterstützt bereits verschiedene Wallbox-Modelle und wird ständig erweitert.
            Vermissen Sie einen Anbieter? Lassen Sie es uns wissen!
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {supportedWallboxes.map((wallbox) => (
              <Card key={wallbox.name} className="flex flex-col items-center p-6">
                <Image
                  src={wallbox.logo}
                  alt={wallbox.name}
                  width={120}
                  height={120}
                  className="mb-4"
                />
                <h3 className="font-semibold mb-2">{wallbox.name}</h3>
                <p className="text-sm text-muted-foreground text-center">
                  {wallbox.description}
                </p>
              </Card>
            ))}
          </div>

          <div className="text-center">
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Wallbox-Anbieter vorschlagen
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Wallbox-Anbieter vorschlagen</DialogTitle>
                  <DialogDescription>
                    Teilen Sie uns mit, welchen Wallbox-Anbieter Sie gerne in EVSync integriert hätten.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="manufacturer">Hersteller</Label>
                    <Input 
                      id="manufacturer" 
                      name="manufacturer"
                      placeholder="z.B. ABL, KEBA, ..." 
                      required 
                    />
                  </div>
                  <div>
                    <Label htmlFor="model">Modell (optional)</Label>
                    <Input 
                      id="model" 
                      name="model"
                      placeholder="z.B. eMH1" 
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Ihre E-Mail</Label>
                    <Input 
                      id="email" 
                      name="email"
                      type="email" 
                      placeholder="ihre@email.de" 
                      required 
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Wird gesendet..." : "Absenden"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </section>

      {/* Neue Sektion: Arbeitgeber-Abrechnung */}
      <section className="py-20 px-4">
        <div className="mx-auto max-w-7xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">
                Einfache Abrechnung mit dem Arbeitgeber
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Check className="h-6 w-6 text-green-500 mt-1" />
                  <div>
                    <h3 className="font-medium">Automatische Berichterstellung</h3>
                    <p className="text-muted-foreground">
                      Monatliche Berichte werden automatisch erstellt und per E-Mail versendet.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-6 w-6 text-green-500 mt-1" />
                  <div>
                    <h3 className="font-medium">Steuerkonform</h3>
                    <p className="text-muted-foreground">
                      Alle Abrechnungen entsprechen den aktuellen Steuerrichtlinien.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-6 w-6 text-green-500 mt-1" />
                  <div>
                    <h3 className="font-medium">Detaillierte Aufschlüsselung</h3>
                    <p className="text-muted-foreground">
                      Jeder Ladevorgang wird mit Datum, Uhrzeit, Energiemenge und Kosten aufgeführt.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-500 to-violet-500 rounded-lg opacity-20 blur-lg" />
              <Card className="relative">
                <CardHeader>
                  <CardTitle>Beispiel-Abrechnung</CardTitle>
                  <CardDescription>Monatliche Abrechnung für den Arbeitgeber</CardDescription>
                </CardHeader>
                <CardContent>
                  <Image
                    src="/example-report.png"
                    alt="Beispiel einer Abrechnung"
                    width={500}
                    height={300}
                    className="rounded-lg border"
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-violet-500 text-white">
        <div className="mx-auto max-w-7xl text-center">
          <h2 className="text-3xl font-bold mb-4">
            Bereit Ihre Wallboxen zu verwalten?
          </h2>
          <p className="mb-8 text-lg opacity-90 max-w-2xl mx-auto">
            Starten Sie noch heute und behalten Sie den Überblick über Ihren Ladeverbrauch.
            Kostenlos und ohne Verpflichtungen.
          </p>
          <Link href="/dashboard">
            <Button size="lg" variant="secondary">
              Kostenlos starten
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t">
        <div className="mx-auto max-w-7xl px-4 text-center text-muted-foreground">
          <p>© {new Date().getFullYear()} EVSync. Alle Rechte vorbehalten.</p>
        </div>
      </footer>
    </div>
  )
}
