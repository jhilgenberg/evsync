import Link from "next/link"

export function Footer() {
  return (
    <footer className="py-8 sm:py-12 border-t">
      <div className="mx-auto max-w-7xl px-4 text-center">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} EVSync. Alle Rechte vorbehalten.</p>
          <div className="flex items-center gap-4">
            <Link href="/impressum" className="hover:text-foreground transition-colors">
              Impressum
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
} 