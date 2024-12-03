export type ElectricityTariff = {
  id: string
  user_id: string
  name: string
  base_rate_monthly: number
  energy_rate: number
  valid_from: string
  valid_to: string | null
  created_at: string
  updated_at: string
}

export type TariffFormData = Omit<
  ElectricityTariff,
  'id' | 'user_id' | 'created_at' | 'updated_at'
> 