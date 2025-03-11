import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth'
import { auth, signIn, signOut, signUp, resetPassword } from '@/lib/firebase/auth'
import { User } from '@/types'
import { UserCrud } from '@/lib/services/crud/user-crud'

interface AuthContextType {
  currentUser: FirebaseUser | null
  appUser: User | null
  isAdmin: boolean
  loading: boolean
  login: (email: string, password: string) => Promise<FirebaseUser>
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
  
  const userCrud = new UserCrud()
  
  useEffect(() => {
    // Set up auth state listener
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user)
      
      if (user) {
        try {
          // Fetch the user from our database
          const dbUser = await userCrud.getByEmail(user.email!)
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
  }, [])
  
  const value = {
    currentUser,
    appUser,
    isAdmin,
    loading,
    login: signIn,
    logout: signOut,
    register: signUp,
    sendPasswordResetEmail: resetPassword
  }
  
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
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