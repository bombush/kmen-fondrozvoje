import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { ReactNode, useEffect } from 'react'

interface AuthGuardProps {
  children: ReactNode
  requireAdmin?: boolean
}

export function AuthGuard({ children, requireAdmin = false }: AuthGuardProps) {
  const { currentUser, isAdmin, loading } = useAuth()
  const router = useRouter()
  
  useEffect(() => {
    if (!loading) {
      if (!currentUser) {
        // User not authenticated, redirect to login
        router.push('/login')
      } else if (requireAdmin && !isAdmin) {
        // User authenticated but not admin, redirect to home
        router.push('/')
      }
    }
  }, [currentUser, isAdmin, loading, requireAdmin, router])
  
  // Show nothing while checking auth or redirecting
  if (loading || !currentUser || (requireAdmin && !isAdmin)) {
    return null
  }
  
  return <>{children}</>
} 