'use client'

import { useEffect, ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'

// Define paths that should not be protected
const PUBLIC_PATHS = ['/login', '/register', '/forgot-password']

interface AuthGuardProps {
  children: ReactNode
  requireAdmin?: boolean
}

export function AuthGuard({ children, requireAdmin = false }: AuthGuardProps) {
  const { currentUser, isAdmin, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  
  // If this is a public path, don't apply protection
  const isPublicPath = PUBLIC_PATHS.some(path => 
    pathname === path || pathname.startsWith(`${path}/`)
  )
  
  // If on a public path, just render children without protection
  if (isPublicPath) {
    return <>{children}</>
  }
  
  useEffect(() => {
    if (!loading && !currentUser) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`)
    } else if (!loading && requireAdmin && !isAdmin) {
      router.push('/')
    }
  }, [currentUser, isAdmin, loading, pathname, requireAdmin, router])
  
  // Show loading state or children based on auth state
  if (loading) {
    return <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  }
  
  // Show nothing if not authenticated or not admin when required
  if (!currentUser || (requireAdmin && !isAdmin)) {
    return null
  }
  
  return <>{children}</>
} 