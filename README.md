# EVSync

EVSync ist eine Webanwendung zur Verwaltung und Überwachung von Elektrofahrzeug-Ladestationen (Wallboxen). Die Anwendung ermöglicht es Benutzern, ihre Wallboxen zu verwalten, Ladevorgänge zu überwachen und detaillierte Berichte zu erstellen.

## Features

- 🔌 **Wallbox-Management**
  - Unterstützung für verschiedene Wallbox-Hersteller (go-e, Easee)
  - Echtzeit-Statusüberwachung
  - Verwaltung mehrerer Wallboxen

- 📊 **Ladeberichte**
  - Detaillierte Aufzeichnung aller Ladevorgänge
  - Exportfunktion für Berichte
  - Fahrzeugzuordnung für Ladevorgänge

- 🚗 **Fahrzeugverwaltung**
  - Verwaltung mehrerer Fahrzeuge
  - Automatische Zuordnung von Ladevorgängen

- 👥 **Benutzerverwaltung**
  - Sichere Authentifizierung
  - Passwort-Reset-Funktion
  - E-Mail-Verifizierung

## Technologie-Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Backend**: Supabase
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Authentifizierung**: Supabase Auth
- **Datenbank**: PostgreSQL (Supabase)