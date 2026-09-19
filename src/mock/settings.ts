import type { BusinessSettings, PosSettings } from '@/types'

export const businessSettings: BusinessSettings = {
  name: 'RetailPro Superstore',
  phone: '+234 801 234 5678',
  email: 'hello@retailpro.example',
  address: '14 Adeola Odeku Street, Victoria Island, Lagos',
  taxNumber: 'TIN-01923847',
  currency: 'NGN',
  logo: '🛒',
}

export const posSettings: PosSettings = {
  defaultTaxRate: 7.5,
  receiptFooter: 'Thank you for your patronage.',
  enableDiscounts: true,
  requireCustomer: false,
  allowNegativeInventory: false,
}
