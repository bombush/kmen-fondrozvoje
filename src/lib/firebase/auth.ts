import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  sendPasswordResetEmail,
  updateProfile,
  connectAuthEmulator
} from 'firebase/auth'
import { connectFirestoreEmulator } from "firebase/firestore"
import { app, db } from './config'
import { User } from '@/types'

// Get Firebase Auth instance
export const auth = getAuth(app)

// Connect to emulators when in development
if (process.env.NODE_ENV === 'development') {
  // Use window to avoid SSR issues
  if (typeof window !== 'undefined') {
    // Connect to Auth emulator
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true })
    
    // Connect to Firestore emulator
    connectFirestoreEmulator(db, 'localhost', 8080)
    
    console.log('Using Firebase emulators')
  }
}

// Sign in with email and password
export const signIn = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    return userCredential.user
  } catch (error: any) {
    console.error('Error signing in:', error)
    throw new Error(mapAuthErrorToMessage(error.code))
  }
}

// Sign up with email and password
export const signUp = async (email: string, password: string, displayName: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    
    // Update profile with display name
    await updateProfile(userCredential.user, {
      displayName: displayName
    })
    
    return userCredential.user
  } catch (error: any) {
    console.error('Error signing up:', error)
    throw new Error(mapAuthErrorToMessage(error.code))
  }
}

// Sign out
export const signOut = async () => {
  try {
    await firebaseSignOut(auth)
  } catch (error) {
    console.error('Error signing out:', error)
    throw error
  }
}

// Send password reset email
export const resetPassword = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email)
  } catch (error: any) {
    console.error('Error sending password reset email:', error)
    throw new Error(mapAuthErrorToMessage(error.code))
  }
}

// Map Firebase Auth error codes to user-friendly messages
export const mapAuthErrorToMessage = (errorCode: string): string => {
  const errorMessages: Record<string, string> = {
    'auth/invalid-email': 'The email address is not valid.',
    'auth/user-disabled': 'This account has been disabled.',
    'auth/user-not-found': 'No account found with this email address.',
    'auth/wrong-password': 'Incorrect password.',
    'auth/email-already-in-use': 'This email address is already in use.',
    'auth/weak-password': 'The password is too weak.',
    'auth/operation-not-allowed': 'Email/password accounts are not enabled.',
    'auth/too-many-requests': 'Too many sign-in attempts. Please try again later.',
    'auth/network-request-failed': 'A network error occurred. Please check your connection.'
  }

  return errorMessages[errorCode] || 'An unknown error occurred. Please try again.'
} 