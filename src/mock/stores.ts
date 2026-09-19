import type { Store } from '@/types'

export const stores: Store[] = [
  {
    id: 'store-1',
    name: 'Main Branch',
    code: 'MB-LAG',
    address: '14 Adeola Odeku Street, Victoria Island, Lagos',
    phone: '+234 801 234 5678',
    managerId: 'user-2',
    status: 'active',
    createdAt: '2023-01-15T09:00:00.000Z',
  },
  {
    id: 'store-2',
    name: 'Ikeja Branch',
    code: 'IK-LAG',
    address: '48 Awolowo Way, Ikeja, Lagos',
    phone: '+234 802 345 6789',
    managerId: null,
    status: 'active',
    createdAt: '2023-04-02T09:00:00.000Z',
  },
  {
    id: 'store-3',
    name: 'Lekki Branch',
    code: 'LK-LAG',
    address: '2 Admiralty Way, Lekki Phase 1, Lagos',
    phone: '+234 803 456 7890',
    managerId: null,
    status: 'active',
    createdAt: '2023-08-20T09:00:00.000Z',
  },
  {
    id: 'store-4',
    name: 'Asaba Branch',
    code: 'AS-DEL',
    address: '105 Nnebisi Road, Asaba, Delta',
    phone: '+234 804 567 8901',
    managerId: null,
    status: 'active',
    createdAt: '2024-02-11T09:00:00.000Z',
  },
]
