import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import type { Permission } from '@/lib/rbac'
import { homeForRole } from '@/lib/home'
import { EmptyState } from '@/components/shared/States'
import { ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'

interface ProtectedRouteProps {
  children: React.ReactNode
  permission?: Permission
}

export function ProtectedRoute({ children, permission }: ProtectedRouteProps) {
  const { isAuthenticated, hasPermission, user } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  if (permission && !hasPermission(permission)) {
    return (
      <div className="mx-auto max-w-lg py-16">
        <EmptyState
          icon={ShieldAlert}
          title="Access denied"
          description="You don't have permission to view this page. If you believe this is a mistake, contact your administrator."
          action={
            <Button asChild>
              <Link to={user ? homeForRole(user.role) : '/login'}>Back to home</Link>
            </Button>
          }
        />
      </div>
    )
  }

  return <>{children}</>
}
