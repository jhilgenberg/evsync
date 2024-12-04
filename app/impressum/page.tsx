export default function ImpressumPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-3xl py-12">
        <h1 className="text-3xl font-bold mb-8">Impressum</h1>

        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-semibold mb-4">Angaben gemäß § 5 TMG</h2>
            <div className="space-y-2">
              <p>Julian Hilgenberg</p>
              <p>Marienweg 5</p>
              <p>46342 Velen</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Kontakt</h2>
            <div className="space-y-2">
              <p>Telefon: +49 (0) 15678 528166</p>
              <p>E-Mail: julian@hilgenberg.cc</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Streitschlichtung</h2>
            <p className="text-sm text-muted-foreground">
              Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit: 
              <a href="https://ec.europa.eu/consumers/odr/" className="text-primary hover:underline ml-1" target="_blank" rel="noopener noreferrer">
                https://ec.europa.eu/consumers/odr/
              </a>
            </p>
            <p className="text-sm text-muted-foreground mt-4">
              Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer 
              Verbraucherschlichtungsstelle teilzunehmen.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Haftung für Inhalte</h2>
            <p className="text-sm text-muted-foreground">
              Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den
              allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht
              verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen
              zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Haftung für Links</h2>
            <p className="text-sm text-muted-foreground">
              Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben.
              Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der
              verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Urheberrecht</h2>
            <p className="text-sm text-muted-foreground">
              Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen
              Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der
              Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
} 