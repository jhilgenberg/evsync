'use client'

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"

interface SupportDialogProps {
  trigger: React.ReactNode
}

export function SupportDialog({ trigger }: SupportDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>EVSync unterstützen</DialogTitle>
          <DialogDescription>
            Ihre Unterstützung hilft uns, EVSync weiterzuentwickeln und neue Features zu implementieren.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6">
          <div className="space-y-4">
            <h3 className="font-medium">Einmalige Spende</h3>
            <div className="grid grid-cols-3 gap-2">
              {[5, 10, 20].map((amount) => (
                <Button
                  key={amount}
                  variant="outline"
                  onClick={() => window.open(`https://www.paypal.com/paypalme/hilgenberg/${amount}`, '_blank')}
                >
                  {amount}€
                </Button>
              ))}
            </div>
            <Button 
              className="w-full"
              onClick={() => window.open('https://www.paypal.com/paypalme/hilgenberg', '_blank')}
            >
              Anderen Betrag wählen
            </Button>
          </div>
          <Separator />
          <div className="space-y-4">
            <h3 className="font-medium">Monatliche Unterstützung</h3>
            <div className="grid grid-cols-3 gap-2">
              {[3, 5, 10].map((amount) => (
                <Button
                  key={amount}
                  variant="outline"
                  onClick={() => window.open(`https://github.com/sponsors/jhilgenberg?amount=${amount}`, '_blank')}
                >
                  {amount}€ / Monat
                </Button>
              ))}
            </div>
            <Button 
              className="w-full"
              onClick={() => window.open('https://github.com/sponsors/jhilgenberg', '_blank')}
            >
              GitHub Sponsors
            </Button>
          </div>
          <div className="text-sm text-muted-foreground">
            <p>Andere Möglichkeiten uns zu unterstützen:</p>
            <ul className="list-disc list-inside mt-2">
              <li>Melde Bugs oder schlage neue Features vor</li>
              <li>Teile EVSync mit anderen</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 