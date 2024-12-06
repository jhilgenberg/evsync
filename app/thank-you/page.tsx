'use client'

import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function ThankYouPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-3xl font-bold">Vielen Dank für Ihre Registrierung!</h1>
      <p className="mt-4 text-lg text-muted-foreground">
        Bitte überprüfen Sie Ihre E-Mail-Adresse, um Ihr Konto zu aktivieren.
      </p>
      <Link href="/auth" className="mt-6">
        <Button variant="outline">Zurück zur Anmeldung</Button>
      </Link>
    </div>
  )
} 