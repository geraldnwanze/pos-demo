# RetailPro — POS & Inventory Management (Demo)

A polished, production-quality **Point of Sale & Inventory Management** demo for
Nigerian retail, built as a frontend-only application with a swappable mock
service layer.

> This is a demo. There is **no backend** — all data is mock data held in Zustand
> stores and persisted to `localStorage`. The service layer (`src/services`,
> `src/stores`) is structured so a real API can replace the mocks without
> rewriting components.

## Tech stack

- **React 19 + TypeScript** (strict) + **Vite**
- **React Router** for routing & route-level guards
- **Tailwind CSS** + **shadcn/ui-style** components (Radix primitives)
- **Zustand** for global state (auth, data, cart, UI)
- **React Hook Form + Zod** for forms & validation
- **Recharts** for dashboards & reports
- **TanStack Table** for data-heavy tables
- **date-fns** for dates · **Lucide** icons · **Sonner** toasts

## Getting started

```bash
npm install
npm run dev      # start the dev server (http://localhost:5173)
npm run build    # type-check + production build
npm run lint     # eslint
```

## Demo accounts

All accounts use the password **`password`**.

| Role        | Email                    | Access                          |
| ----------- | ------------------------ | ------------------------------- |
| Super Admin | superadmin@example.com   | Full system access              |
| Admin       | admin@example.com        | Store administration            |
| Seller      | seller@example.com       | POS & cashier (POS, My Sales…)  |

## Key workflows

1. **Seller sale** — Login as Seller → POS → search/add products → set customer,
   discount & payment → Complete Sale → receipt (print/download) → stock deducts,
   transaction appears in **My Sales**, dashboards update.
2. **Admin inventory** — Products → create product with initial stock → appears in
   Inventory → adjust stock → stock history & audit log update.
3. **Admin purchase** — Purchases → create PO with line items → mark **Received**
   → inventory increases.
4. **Super Admin** — global dashboard, manage Users/Stores, assign roles, view
   **Audit Logs**, reset demo data (Settings → Data).

## Role-based access control

Permissions are defined in [`src/lib/rbac.ts`](src/lib/rbac.ts) and enforced both
in the UI (navigation & buttons) **and** at the route level
([`ProtectedRoute`](src/components/auth/ProtectedRoute.tsx)) — visiting an
unauthorized route directly shows an access-denied screen.

## Project structure

```
src/
  components/   ui/ (shadcn-style)· shared/· layout/· charts/· feature dialogs
  config/       navigation & breadcrumb config
  hooks/        useAuth, loading helpers
  lib/          rbac, analytics, sale math, formatters, utils
  mock/         seed data (products, sales, customers, …)
  pages/        one component per route
  services/     auth abstraction (swap for a real API)
  stores/       zustand stores (auth, data, cart, ui)
  types/        domain types
```

All currency is **NGN (₦)** and formatted via a single helper
([`src/lib/format.ts`](src/lib/format.ts)). Reset the demo data any time from
**Settings → Data**.
