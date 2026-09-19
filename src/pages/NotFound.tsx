import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { homeForRole } from '@/lib/home'

export default function NotFound() {
  const { user } = useAuth()
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-muted/30 p-6 text-center">
      <p className="text-7xl font-bold text-primary">404</p>
      <h1 className="text-2xl font-bold">Page not found</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
      </p>
      <Button asChild>
        <Link to={user ? homeForRole(user.role) : '/login'}>Go home</Link>
      </Button>
    </div>
  )
}
