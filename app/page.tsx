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
import { WALLBOX_PROVIDERS } from '@/config/wallbox-providers'

const supportedWallboxes = WALLBOX_PROVIDERS.map(provider => ({
  name: provider.name,
  logo: provider.logo,
  description: provider.description
}))

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
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section - optimierte Abstände */}
      <header className="flex flex-col items-center justify-center px-4 py-16 sm:py-24 text-center bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-background">
        <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 via-blue-500 to-violet-500 bg-clip-text text-transparent">
          EVSync
        </h1>
        <p className="mt-4 text-lg sm:text-xl text-muted-foreground max-w-2xl px-4">
          Die zentrale Plattform für die Verwaltung Ihrer Wallboxen. 
          Überwachen, analysieren und optimieren Sie Ihr Ladeverhalten.
        </p>
        <div className="mt-8 flex justify-center w-full px-4">
          <Link href="/auth" className="w-full sm:w-auto max-w-xs">
            <Button size="lg" className="w-full bg-gradient-to-r from-blue-600 to-blue-500">
              Jetzt starten
            </Button>
          </Link>
        </div>
      </header>

      {/* Features Grid - angepasstes Layout */}
      <section className="py-16 sm:py-20 px-4">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-12">
            Alles was Sie brauchen
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="p-4 sm:p-6 hover:shadow-lg transition-shadow">
                <feature.icon className="h-10 w-10 sm:h-12 sm:w-12 text-blue-500 mb-4" />
                <h3 className="text-base sm:text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm sm:text-base text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Unterstützte Wallboxen - verbesserte mobile Darstellung */}
      <section className="py-16 sm:py-20 px-4 bg-muted/50">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4">
            Unterstützte Wallboxen
          </h2>
          <p className="text-center text-sm sm:text-base text-muted-foreground mb-8 sm:mb-12 max-w-2xl mx-auto px-4">
            EVSync unterstützt bereits verschiedene Wallbox-Modelle und wird ständig erweitert.
            Vermissen Sie einen Anbieter? Lassen Sie es uns wissen!
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8 mb-8 sm:mb-12">
            {supportedWallboxes.map((wallbox) => (
              <Card key={wallbox.name} className="flex flex-col items-center p-4 sm:p-6 hover:shadow-lg transition-shadow">
                <div className="h-16 w-16 sm:h-20 sm:w-20 lg:h-24 lg:w-24 relative mb-4 flex items-center justify-center">
                  <Image
                    src={wallbox.logo}
                    alt={wallbox.name}
                    width={96}
                    height={96}
                    className="object-contain"
                    priority
                  />
                </div>
                <h3 className="text-base sm:text-lg font-semibold mb-2">{wallbox.name}</h3>
                <p className="text-sm text-muted-foreground text-center">
                  {wallbox.description}
                </p>
              </Card>
            ))}
          </div>

          <div className="text-center px-4">
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto">
                  <Plus className="mr-2 h-4 w-4" />
                  <span className="whitespace-nowrap">Wallbox-Anbieter vorschlagen</span>
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

      {/* Arbeitgeber-Abrechnung - mobile Optimierung */}
      <section className="py-16 sm:py-20 px-4">
        <div className="mx-auto max-w-7xl">
          <div className="grid md:grid-cols-2 gap-8 sm:gap-12 items-center">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-6">
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
            <div className="relative mt-8 md:mt-0">
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-500 to-violet-500 rounded-lg opacity-20 blur-lg" />
              <Card className="relative">
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">Beispiel-Abrechnung</CardTitle>
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
      <section className="py-16 sm:py-20 px-4 bg-gradient-to-r from-blue-600 to-violet-500 text-white">
        <div className="mx-auto max-w-7xl text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            Bereit Ihre Wallboxen zu verwalten?
          </h2>
          <p className="mb-8 text-base sm:text-lg opacity-90 max-w-2xl mx-auto px-4">
            Starten Sie noch heute und behalten Sie den Überblick über Ihren Ladeverbrauch.
            Kostenlos und ohne Verpflichtungen.
          </p>
          <Link href="/auth" className="block w-full sm:w-auto sm:inline-block px-4">
            <Button size="lg" variant="secondary" className="w-full sm:w-auto">
              Kostenlos starten
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
