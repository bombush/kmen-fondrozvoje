import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

// Initialize Firebase Admin for server-side operations
function initAdmin() {
  const apps = getApps()
  
  // Only initialize if no apps exist
  if (apps.length === 0) {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    
    // Use service account if provided, otherwise use default credentials
    if (process.env.FIREBASE_ADMIN_PRIVATE_KEY) {
      return initializeApp({
        credential: cert({
          projectId,
          clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
          // Replace newlines in the private key
          privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
        databaseURL: `https://${projectId}.firebaseio.com`,
      })
    }
    
    // Default credentials (for Firebase emulator or deployed environments)
    return initializeApp()
  }
  
  return apps[0]
}

// Initialize the app
export const app = initAdmin()

// Export Firestore
export const adminDb = getFirestore() 