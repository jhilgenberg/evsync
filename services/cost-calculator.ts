import { ElectricityTariff } from '@/types/tariff'

export class CostCalculator {
  private tariffs: ElectricityTariff[]

  constructor(tariffs: ElectricityTariff[]) {
    this.tariffs = tariffs.sort((a, b) => 
      new Date(b.valid_from).getTime() - new Date(a.valid_from).getTime()
    )
  }

  private findApplicableTariff(date: Date): ElectricityTariff | null {
    return this.tariffs.find(tariff => {
      const validFrom = new Date(tariff.valid_from)
      const validTo = tariff.valid_to ? new Date(tariff.valid_to) : new Date()
      return date >= validFrom && date <= validTo
    }) || null
  }

  calculateSessionCost(
    startTime: Date,
    endTime: Date,
    energyKwh: number
  ): { cost: number; tariff: ElectricityTariff | null } {
    const tariff = this.findApplicableTariff(startTime)
    if (!tariff) return { cost: 0, tariff: null }

    // Berechne die anteilige Grundgebühr
    const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60)
    const baseRateHourly = tariff.base_rate_monthly / (30 * 24) // Vereinfachte Berechnung
    const baseRateCost = baseRateHourly * durationHours

    // Berechne die Energiekosten (Umrechnung von ct/kWh in €/kWh)
    const energyCost = (tariff.energy_rate / 100) * energyKwh

    return {
      cost: baseRateCost + energyCost,
      tariff
    }
  }
} 