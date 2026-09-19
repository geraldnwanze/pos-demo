import type { Product } from '@/types'

interface Seed {
  name: string
  sku: string
  barcode: string
  categoryId: string
  cost: number
  price: number
  stock: number
  minStock: number
  supplierId: string
  image: string
  tax?: number
  status?: 'active' | 'inactive'
  unitsSold: number
}

const seeds: Seed[] = [
  // Beverages
  { name: 'Coca Cola 50cl', sku: 'BEV-0001', barcode: '5449000000996', categoryId: 'cat-1', cost: 180, price: 250, stock: 320, minStock: 60, supplierId: 'sup-1', image: '🥤', unitsSold: 1420 },
  { name: 'Pepsi 50cl', sku: 'BEV-0002', barcode: '0120000000012', categoryId: 'cat-1', cost: 175, price: 250, stock: 45, minStock: 60, supplierId: 'sup-1', image: '🥤', unitsSold: 980 },
  { name: 'Fanta Orange 50cl', sku: 'BEV-0003', barcode: '5449000011114', categoryId: 'cat-1', cost: 180, price: 250, stock: 210, minStock: 60, supplierId: 'sup-1', image: '🍊', unitsSold: 870 },
  { name: 'Sprite 50cl', sku: 'BEV-0004', barcode: '5449000014535', categoryId: 'cat-1', cost: 180, price: 250, stock: 165, minStock: 60, supplierId: 'sup-1', image: '🥤', unitsSold: 760 },
  { name: 'Eva Water 75cl', sku: 'BEV-0005', barcode: '6155000000015', categoryId: 'cat-1', cost: 90, price: 150, stock: 540, minStock: 100, supplierId: 'sup-1', image: '💧', unitsSold: 2200 },
  { name: 'Maltina 33cl', sku: 'BEV-0006', barcode: '6034000000023', categoryId: 'cat-1', cost: 260, price: 350, stock: 12, minStock: 40, supplierId: 'sup-1', image: '🍺', unitsSold: 640 },
  { name: 'Chi Exotic Juice 1L', sku: 'BEV-0007', barcode: '6155110000117', categoryId: 'cat-1', cost: 700, price: 950, stock: 88, minStock: 30, supplierId: 'sup-1', image: '🧃', unitsSold: 310 },
  { name: 'Bigi Cola 60cl', sku: 'BEV-0008', barcode: '6157000000048', categoryId: 'cat-1', cost: 130, price: 200, stock: 260, minStock: 60, supplierId: 'sup-1', image: '🥤', unitsSold: 720 },

  // Food
  { name: 'Indomie Noodles 70g', sku: 'FOO-0001', barcode: '6009510800014', categoryId: 'cat-2', cost: 130, price: 200, stock: 900, minStock: 150, supplierId: 'sup-2', image: '🍜', unitsSold: 3100 },
  { name: 'Indomie Noodles Chicken 120g', sku: 'FOO-0002', barcode: '6009510800021', categoryId: 'cat-2', cost: 220, price: 320, stock: 420, minStock: 120, supplierId: 'sup-2', image: '🍜', unitsSold: 1650 },
  { name: 'Golden Penny Spaghetti 500g', sku: 'FOO-0003', barcode: '6151100000032', categoryId: 'cat-2', cost: 550, price: 780, stock: 180, minStock: 60, supplierId: 'sup-5', image: '🍝', unitsSold: 540 },
  { name: 'Golden Penny Semovita 1kg', sku: 'FOO-0004', barcode: '6151100000049', categoryId: 'cat-2', cost: 1200, price: 1650, stock: 96, minStock: 30, supplierId: 'sup-5', image: '🌾', unitsSold: 280 },
  { name: 'Dangote Sugar 1kg', sku: 'FOO-0005', barcode: '6152000000056', categoryId: 'cat-2', cost: 1100, price: 1500, stock: 8, minStock: 25, supplierId: 'sup-5', image: '🧂', unitsSold: 190 },
  { name: 'Honeywell Wheat Meal 1kg', sku: 'FOO-0006', barcode: '6153000000063', categoryId: 'cat-2', cost: 1400, price: 1900, stock: 54, minStock: 20, supplierId: 'sup-5', image: '🌾', unitsSold: 120 },
  { name: 'Mama Gold Rice 5kg', sku: 'FOO-0007', barcode: '6151100000070', categoryId: 'cat-2', cost: 7200, price: 9500, stock: 40, minStock: 15, supplierId: 'sup-5', image: '🍚', unitsSold: 210 },

  // Dairy
  { name: 'Peak Milk Powder 400g', sku: 'DAI-0001', barcode: '8712000000018', categoryId: 'cat-3', cost: 2600, price: 3400, stock: 130, minStock: 40, supplierId: 'sup-3', image: '🥛', unitsSold: 620 },
  { name: 'Peak Milk Tin 170g', sku: 'DAI-0002', barcode: '8712000000025', categoryId: 'cat-3', cost: 700, price: 950, stock: 240, minStock: 60, supplierId: 'sup-3', image: '🥛', unitsSold: 1150 },
  { name: 'Milo Tin 500g', sku: 'DAI-0003', barcode: '6034000010021', categoryId: 'cat-3', cost: 2800, price: 3700, stock: 18, minStock: 30, supplierId: 'sup-3', image: '☕', unitsSold: 480 },
  { name: 'Bournvita Refill 450g', sku: 'DAI-0004', barcode: '6034000010038', categoryId: 'cat-3', cost: 2400, price: 3200, stock: 76, minStock: 25, supplierId: 'sup-3', image: '☕', unitsSold: 340 },
  { name: 'Three Crowns Milk 380g', sku: 'DAI-0005', barcode: '8712000010017', categoryId: 'cat-3', cost: 2500, price: 3300, stock: 62, minStock: 20, supplierId: 'sup-3', image: '🥛', unitsSold: 260 },

  // Personal Care
  { name: 'Dettol Antiseptic 250ml', sku: 'PCA-0001', barcode: '5000000000014', categoryId: 'cat-4', cost: 1200, price: 1750, stock: 140, minStock: 40, supplierId: 'sup-4', image: '🧴', unitsSold: 430 },
  { name: 'Premier Soap 100g', sku: 'PCA-0002', barcode: '5000000000021', categoryId: 'cat-4', cost: 300, price: 450, stock: 380, minStock: 80, supplierId: 'sup-4', image: '🧼', unitsSold: 1240 },
  { name: 'Close-Up Toothpaste 140g', sku: 'PCA-0003', barcode: '5000000000038', categoryId: 'cat-4', cost: 650, price: 950, stock: 96, minStock: 30, supplierId: 'sup-4', image: '🪥', unitsSold: 510 },
  { name: 'Nivea Roll-On 50ml', sku: 'PCA-0004', barcode: '4005900000045', categoryId: 'cat-4', cost: 1400, price: 2100, stock: 5, minStock: 20, supplierId: 'sup-4', image: '🧴', unitsSold: 175 },

  // Household
  { name: 'Ariel Detergent 900g', sku: 'HOU-0001', barcode: '4015600000019', categoryId: 'cat-5', cost: 2100, price: 2900, stock: 110, minStock: 30, supplierId: 'sup-4', image: '🧺', unitsSold: 390 },
  { name: 'Morning Fresh Dishwash 425ml', sku: 'HOU-0002', barcode: '6001000000026', categoryId: 'cat-5', cost: 900, price: 1350, stock: 0, minStock: 25, supplierId: 'sup-4', image: '🧽', unitsSold: 220 },
  { name: 'Hypo Bleach 1L', sku: 'HOU-0003', barcode: '6001000000033', categoryId: 'cat-5', cost: 600, price: 900, stock: 160, minStock: 40, supplierId: 'sup-4', image: '🧴', unitsSold: 300 },
  { name: 'Power Oil 1L', sku: 'HOU-0004', barcode: '6154000000040', categoryId: 'cat-5', cost: 2200, price: 2950, stock: 70, minStock: 20, supplierId: 'sup-5', image: '🛢️', unitsSold: 250 },

  // Electronics
  { name: 'USB-C Cable 1m', sku: 'ELE-0001', barcode: '7100000000017', categoryId: 'cat-6', cost: 800, price: 1500, stock: 210, minStock: 30, supplierId: 'sup-6', image: '🔌', unitsSold: 640 },
  { name: 'Lightning Cable 1m', sku: 'ELE-0002', barcode: '7100000000024', categoryId: 'cat-6', cost: 1200, price: 2200, stock: 95, minStock: 25, supplierId: 'sup-6', image: '🔌', unitsSold: 410 },
  { name: 'Power Bank 20000mAh', sku: 'ELE-0003', barcode: '7100000000031', categoryId: 'cat-6', cost: 8500, price: 13500, stock: 34, minStock: 10, supplierId: 'sup-6', image: '🔋', unitsSold: 180 },
  { name: 'Wireless Earbuds', sku: 'ELE-0004', barcode: '7100000000048', categoryId: 'cat-6', cost: 6500, price: 11000, stock: 6, minStock: 10, supplierId: 'sup-6', image: '🎧', unitsSold: 140 },
  { name: 'Phone Charger 25W', sku: 'ELE-0005', barcode: '7100000000055', categoryId: 'cat-6', cost: 2400, price: 4200, stock: 120, minStock: 20, supplierId: 'sup-6', image: '⚡', unitsSold: 300 },
  { name: 'Screen Protector Pack', sku: 'ELE-0006', barcode: '7100000000062', categoryId: 'cat-6', cost: 500, price: 1200, stock: 260, minStock: 40, supplierId: 'sup-6', image: '📱', unitsSold: 520 },

  // Airtime & Data
  { name: 'MTN Airtime ₦1000', sku: 'AIR-0001', barcode: '9000000000011', categoryId: 'cat-7', cost: 970, price: 1000, stock: 999, minStock: 50, supplierId: 'sup-6', image: '📶', tax: 0, unitsSold: 3400 },
  { name: 'Airtel Data 1.5GB', sku: 'AIR-0002', barcode: '9000000000028', categoryId: 'cat-7', cost: 950, price: 1000, stock: 999, minStock: 50, supplierId: 'sup-6', image: '📶', tax: 0, unitsSold: 1200 },
  { name: 'Glo Airtime ₦500', sku: 'AIR-0003', barcode: '9000000000035', categoryId: 'cat-7', cost: 485, price: 500, stock: 999, minStock: 50, supplierId: 'sup-6', image: '📶', tax: 0, unitsSold: 1600 },
]

export const products: Product[] = seeds.map((s, i) => ({
  id: `prod-${i + 1}`,
  name: s.name,
  sku: s.sku,
  barcode: s.barcode,
  categoryId: s.categoryId,
  description: `${s.name} — quality retail stock kept at all branches.`,
  costPrice: s.cost,
  sellingPrice: s.price,
  taxRate: s.tax ?? 7.5,
  minStock: s.minStock,
  stock: s.stock,
  reserved: 0,
  supplierId: s.supplierId,
  image: s.image,
  status: s.status ?? 'active',
  unitsSold: s.unitsSold,
  createdAt: '2023-02-01T08:00:00.000Z',
}))
