import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Navigate, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ShoppingBag, Loader2, ArrowRight, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { useAuthStore } from '@/stores/authStore'
import { useAuth } from '@/hooks/useAuth'
import { homeForRole } from '@/lib/home'
import { ROLE_LABELS } from '@/lib/rbac'

const schema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

type FormValues = z.infer<typeof schema>

const DEMO_ACCOUNTS = [
  { role: 'super_admin' as const, email: 'superadmin@example.com', desc: 'Full system access' },
  { role: 'admin' as const, email: 'admin@example.com', desc: 'Store administration' },
  { role: 'seller' as const, email: 'seller@example.com', desc: 'POS & cashier' },
]

export default function Login() {
  const login = useAuthStore((s) => s.login)
  const { isAuthenticated, user } = useAuth()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  })

  if (isAuthenticated && user) {
    return <Navigate to={homeForRole(user.role)} replace />
  }

  const onSubmit = async (values: FormValues) => {
    try {
      const loggedIn = await login(values.email, values.password)
      toast.success(`Welcome back, ${loggedIn.name.split(' ')[0]}!`)
      navigate(homeForRole(loggedIn.role), { replace: true })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Login failed')
    }
  }

  const quickFill = (email: string) => {
    setValue('email', email)
    setValue('password', 'password')
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between bg-sidebar p-12 text-sidebar-foreground lg:flex">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ShoppingBag className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold">RetailPro</span>
        </div>
        <div className="space-y-6">
          <h1 className="text-4xl font-bold leading-tight">
            Run your retail business from one place.
          </h1>
          <p className="max-w-md text-sidebar-foreground/70">
            Point of sale, inventory, purchases, customers and reports — a modern platform built for
            Nigerian retail.
          </p>
          <div className="grid grid-cols-3 gap-4 pt-4">
            {[
              ['1,248', 'Products'],
              ['4,832', 'Customers'],
              ['₦24.8M', 'Monthly revenue'],
            ].map(([value, label]) => (
              <div key={label}>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs text-sidebar-foreground/60">{label}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-sidebar-foreground/50">
          © {new Date().getFullYear()} RetailPro. Demo environment.
        </p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center bg-background p-6">
        <div className="w-full max-w-sm space-y-6">
          <div className="space-y-2 text-center lg:text-left">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-primary-foreground lg:hidden">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold">Sign in to your account</h2>
            <p className="text-sm text-muted-foreground">
              Enter your credentials to access the dashboard.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" {...register('email')} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Signing in…
                </>
              ) : (
                <>
                  Sign in <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <Card>
            <CardContent className="p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Demo accounts — click to fill
              </p>
              <div className="space-y-2">
                {DEMO_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => quickFill(acc.email)}
                    className="flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition-colors hover:bg-accent"
                  >
                    <span>
                      <span className="block font-medium">{ROLE_LABELS[acc.role]}</span>
                      <span className="block text-xs text-muted-foreground">{acc.email}</span>
                    </span>
                    <span className="text-xs text-muted-foreground">{acc.desc}</span>
                  </button>
                ))}
              </div>
              <p className="mt-3 text-center text-xs text-muted-foreground">
                Password for all accounts: <span className="font-mono font-medium">password</span>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
