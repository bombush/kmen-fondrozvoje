'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth'
import { 
  auth, 
  signIn, 
  signOut, 
  signUp, 
  resetPassword, 
  signInWithGoogle 
} from '@/lib/firebase/auth'
import { User } from '@/types'
import { UserCrud } from '@/lib/services/crud/user-crud'
import { usePathname, useRouter } from 'next/navigation'

// Define public paths that don't require authentication
const PUBLIC_PATHS = ['/login', '/register', '/forgot-password']

interface AuthContextType {
  currentUser: FirebaseUser | null
  appUser: User | null
  isAdmin: boolean
  loading: boolean
  login: (email: string, password: string) => Promise<FirebaseUser>
  loginWithGoogle: () => Promise<FirebaseUser>
  logout: () => Promise<void>
  register: (email: string, password: string, name: string) => Promise<FirebaseUser>
  sendPasswordResetEmail: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null)
  const [appUser, setAppUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  
  const userCrud = new UserCrud()
  
  // Handle authentication and routing
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user)
      
      if (user) {
        try {
          // Fetch the user from our database
          const dbUser = await userCrud.getByEmail(user.email!)
          
          // If no user found with this email, sign out the user
          if (!dbUser) {
            console.warn(`User with email ${user.email} not found in database`)
            await signOut()
            router.push('/login?error=User+not+found')
            setCurrentUser(null)
            setAppUser(null)
            setIsAdmin(false)
            return
          }
          
          setAppUser(dbUser)
          
          // Set admin status
          setIsAdmin(dbUser?.role === 'admin')
        } catch (error) {
          console.error('Error fetching user data:', error)
          setAppUser(null)
          setIsAdmin(false)
        }
      } else {
        setAppUser(null)
        setIsAdmin(false)
      }
      
      setLoading(false)
    })
    
    // Clean up subscription
    return unsubscribe
  }, [pathname])
  
  const value = {
    currentUser,
    appUser,
    isAdmin,
    loading,
    login: signIn,
    loginWithGoogle: signInWithGoogle,
    logout: signOut,
    register: signUp,
    sendPasswordResetEmail: resetPassword
  }
  
  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        // Show loading state
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 