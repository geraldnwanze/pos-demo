import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Building2, Receipt, User as UserIcon, Database, RotateCcw } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { useDataStore } from '@/stores/dataStore'
import { useAuth } from '@/hooks/useAuth'
import { useCartStore } from '@/stores/cartStore'

const businessSchema = z.object({
  name: z.string().min(2, 'Required'),
  phone: z.string().min(7, 'Required'),
  email: z.string().email('Enter a valid email'),
  address: z.string().min(2, 'Required'),
  taxNumber: z.string().optional(),
  currency: z.string(),
  logo: z.string().optional(),
})
type BusinessValues = z.infer<typeof businessSchema>

const profileSchema = z.object({
  name: z.string().min(2, 'Required'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().min(7, 'Required'),
  password: z.string().optional(),
})
type ProfileValues = z.infer<typeof profileSchema>

export default function Settings() {
  const { tab } = useParams()
  const navigate = useNavigate()
  const { actor, hasPermission, user } = useAuth()
  const canManageSettings = hasPermission('settings.manage')
  const tabs = canManageSettings ? ['business', 'pos', 'profile', 'data'] : ['profile', 'data']
  const active = tabs.includes(tab ?? '') ? (tab as string) : tabs[0]

  const business = useDataStore((s) => s.businessSettings)
  const pos = useDataStore((s) => s.posSettings)
  const updateBusiness = useDataStore((s) => s.updateBusinessSettings)
  const updatePos = useDataStore((s) => s.updatePosSettings)
  const updateUser = useDataStore((s) => s.updateUser)
  const resetDemo = useDataStore((s) => s.resetDemo)
  const clearCart = useCartStore((s) => s.clear)

  const [resetOpen, setResetOpen] = useState(false)

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Configure your business and account preferences." />

      <Tabs value={active} onValueChange={(v) => navigate(`/settings/${v}`)}>
        <TabsList className="flex-wrap">
          {canManageSettings && (
            <>
              <TabsTrigger value="business">
                <Building2 className="mr-1.5 h-4 w-4" /> Business
              </TabsTrigger>
              <TabsTrigger value="pos">
                <Receipt className="mr-1.5 h-4 w-4" /> POS
              </TabsTrigger>
            </>
          )}
          <TabsTrigger value="profile">
            <UserIcon className="mr-1.5 h-4 w-4" /> Profile
          </TabsTrigger>
          <TabsTrigger value="data">
            <Database className="mr-1.5 h-4 w-4" /> Data
          </TabsTrigger>
        </TabsList>

        {canManageSettings && (
          <TabsContent value="business">
            <BusinessSettingsForm
              defaults={business}
              onSave={(v) => {
                updateBusiness({ ...v, taxNumber: v.taxNumber ?? '', logo: v.logo || '🛒' }, actor)
                toast.success('Business settings saved.')
              }}
            />
          </TabsContent>
        )}

        {canManageSettings && (
          <TabsContent value="pos">
            <PosSettingsForm pos={pos} onSave={updatePos} actor={actor} />
          </TabsContent>
        )}

        <TabsContent value="profile">
          {user && (
            <ProfileForm
              defaults={{ name: user.name, email: user.email, phone: user.phone, password: '' }}
              onSave={(v) => {
                updateUser(user.id, { name: v.name, email: v.email, phone: v.phone }, actor)
                toast.success('Profile updated successfully.')
              }}
            />
          )}
        </TabsContent>

        <TabsContent value="data">
          <Card>
            <CardHeader>
              <CardTitle>Demo data</CardTitle>
              <CardDescription>
                This demo stores all data locally in your browser. Reset to restore the original
                sample data.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" onClick={() => setResetOpen(true)}>
                <RotateCcw className="h-4 w-4" /> Reset demo data
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        title="Reset all demo data?"
        description="This restores the original sample products, sales, inventory and settings. Any changes you've made will be lost."
        confirmLabel="Reset data"
        destructive
        onConfirm={() => {
          resetDemo()
          clearCart()
          toast.success('Demo data has been reset.')
          setResetOpen(false)
        }}
      />
    </div>
  )
}

function BusinessSettingsForm({
  defaults,
  onSave,
}: {
  defaults: BusinessValues
  onSave: (v: BusinessValues) => void
}) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BusinessValues>({ resolver: zodResolver(businessSchema), defaultValues: defaults })

  useEffect(() => {
    reset(defaults)
  }, [defaults, reset])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Business settings</CardTitle>
        <CardDescription>Details shown on receipts and reports.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSave)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Business name</Label>
              <Input {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Logo / Emoji</Label>
              <Input maxLength={2} {...register('logo')} />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input {...register('phone')} />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" {...register('email')} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Tax number</Label>
              <Input {...register('taxNumber')} />
            </div>
            <div className="space-y-1.5">
              <Label>Currency</Label>
              <Select value={watch('currency')} onValueChange={(v) => setValue('currency', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NGN">NGN (₦)</SelectItem>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Address</Label>
            <Textarea {...register('address')} />
          </div>
          <Button type="submit">Save changes</Button>
        </form>
      </CardContent>
    </Card>
  )
}

import type { Actor } from '@/stores/dataStore'
import type { PosSettings } from '@/types'

function PosSettingsForm({
  pos,
  onSave,
  actor,
}: {
  pos: PosSettings
  onSave: (patch: Partial<PosSettings>, actor: Actor) => void
  actor: Actor
}) {
  const [defaultTaxRate, setDefaultTaxRate] = useState(String(pos.defaultTaxRate))
  const [receiptFooter, setReceiptFooter] = useState(pos.receiptFooter)
  const [enableDiscounts, setEnableDiscounts] = useState(pos.enableDiscounts)
  const [requireCustomer, setRequireCustomer] = useState(pos.requireCustomer)
  const [allowNegativeInventory, setAllowNegativeInventory] = useState(pos.allowNegativeInventory)

  const save = () => {
    onSave(
      {
        defaultTaxRate: Number(defaultTaxRate),
        receiptFooter,
        enableDiscounts,
        requireCustomer,
        allowNegativeInventory,
      },
      actor,
    )
    toast.success('POS settings saved.')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>POS settings</CardTitle>
        <CardDescription>Control checkout behavior.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Default tax rate (%)</Label>
            <Input type="number" step="0.1" value={defaultTaxRate} onChange={(e) => setDefaultTaxRate(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Receipt footer</Label>
          <Textarea value={receiptFooter} onChange={(e) => setReceiptFooter(e.target.value)} />
        </div>
        <Toggle label="Enable discounts" description="Allow cashiers to apply discounts at checkout." checked={enableDiscounts} onChange={setEnableDiscounts} />
        <Toggle label="Require customer" description="A customer must be selected to complete a sale." checked={requireCustomer} onChange={setRequireCustomer} />
        <Toggle label="Allow negative inventory" description="Permit selling more than the available stock." checked={allowNegativeInventory} onChange={setAllowNegativeInventory} />
        <Button onClick={save}>Save changes</Button>
      </CardContent>
    </Card>
  )
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between rounded-md border p-3">
      <div>
        <Label>{label}</Label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  )
}

function ProfileForm({
  defaults,
  onSave,
}: {
  defaults: ProfileValues
  onSave: (v: ProfileValues) => void
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileValues>({ resolver: zodResolver(profileSchema), defaultValues: defaults })

  useEffect(() => {
    reset(defaults)
  }, [defaults, reset])

  return (
    <Card>
      <CardHeader>
        <CardTitle>My profile</CardTitle>
        <CardDescription>Update your personal account details.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSave)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Full name</Label>
              <Input {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input {...register('phone')} />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" {...register('email')} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>New password</Label>
              <Input type="password" placeholder="••••••••" {...register('password')} />
            </div>
          </div>
          <Button type="submit">Save changes</Button>
        </form>
      </CardContent>
    </Card>
  )
}
