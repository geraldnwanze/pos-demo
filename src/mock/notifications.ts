import { subMinutes, subHours } from 'date-fns'
import type { AppNotification } from '@/types'
import { NOW } from './generate'

export const notifications: AppNotification[] = [
  {
    id: 'notif-1',
    type: 'stock',
    title: 'Low stock alert',
    message: 'Pepsi 50cl is below its minimum stock level (45 / 60).',
    read: false,
    createdAt: subMinutes(NOW, 20).toISOString(),
  },
  {
    id: 'notif-2',
    type: 'sale',
    title: 'New sale completed',
    message: 'Tunde Bakare completed a sale of ₦12,450.',
    read: false,
    createdAt: subMinutes(NOW, 55).toISOString(),
  },
  {
    id: 'notif-3',
    type: 'stock',
    title: 'Out of stock',
    message: 'Morning Fresh Dishwash 425ml is now out of stock.',
    read: false,
    createdAt: subHours(NOW, 2).toISOString(),
  },
  {
    id: 'notif-4',
    type: 'purchase',
    title: 'Purchase received',
    message: 'Purchase order PO-00013 has been received into inventory.',
    read: true,
    createdAt: subHours(NOW, 26).toISOString(),
  },
  {
    id: 'notif-5',
    type: 'inventory',
    title: 'Inventory adjustment',
    message: 'Stock count adjustment applied to Maltina 33cl.',
    read: true,
    createdAt: subHours(NOW, 30).toISOString(),
  },
]
