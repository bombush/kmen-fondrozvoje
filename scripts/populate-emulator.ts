/**
 * Firebase Emulator Population Script
 * 
 * This script populates the Firebase emulators with sample data for development.
 * Run with: npx ts-node scripts/populate-emulator.ts
 * 
 * Make sure emulators are running: firebase emulators:start
 */

// Configure emulator connection
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099'
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080'

import * as admin from 'firebase-admin'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import {
  generateUsers,
  generateProjects,
  generateStatements,
  generatePayments,
  generateCreditAwards,
  generatePledges,
  generateHistoryActions
} from './sample-data'
import { User, Project, BankStatement, BankPayment, CreditAward, Pledge, HistoryAction } from '../src/types'

// Initialize Firebase Admin SDK - alternative method for emulators
const firebaseConfig = {
  projectId: 'kmen-fondrozvoje',
}

function log(message: string, obj?:any) {
  const yellow = '\x1b[33m'; // ANSI escape code for yellow
  const reset = '\x1b[0m'; // ANSI escape code to reset color
  if (arguments.length > 1) {
    console.log(`${yellow}[populate-emulator]${reset} ${message}`, obj);
  } else {
    console.log(`${yellow}[populate-emulator]${reset} ${message}`);
  }
}

function logError(message: string, error?:any) {
  const red = '\x1b[31m'; // ANSI escape code for red
  const reset = '\x1b[0m'; // ANSI escape code to reset color
  console.error(`${red}[populate-emulator]${reset} ${message}`, error);
}

async function waitForEmulators() {
  // Add check to Make sure emulators are running: firebase emulators:start
    // poll if emulators are running periodically until a timeout is reached. 
    // Throw error if they are not running after the timeout
    const timeout = 30000
    const startTime = Date.now()
    log('Using Firebase Auth Emulator at:', process.env.FIREBASE_AUTH_EMULATOR_HOST)
    log('Using Firestore Emulator at:', process.env.FIRESTORE_EMULATOR_HOST)
    log('Waiting for emulators to start...')
    

    while (true) {

      let authEmulator = false
      let firestoreEmulator = false
      
      try {
        const authResponse = await fetch('http://localhost:9099')
        authEmulator = authResponse.ok
      } catch (error) {
        // Auth emulator not running
      }

      try {
        const firestoreResponse = await fetch('http://localhost:8080')
        firestoreEmulator = firestoreResponse.ok
      } catch (error) {
        // Firestore emulator not running
      }

      
      if (authEmulator && firestoreEmulator) {
        break
      }
      await new Promise(resolve => setTimeout(resolve, 1000))
      if (Date.now() - startTime > timeout) {
        throw new Error('Emulators are not running. Please start them with: firebase emulators:start')
      }
    } 
}

waitForEmulators()
.then(() => {
  // Initialize without explicit credentials for emulator use
try {
  admin.app()
} catch (error) {
  admin.initializeApp(firebaseConfig)
}

// Connect to emulator explicitly to ensure connection
const auth = getAuth()
const db = getFirestore()

// Clear existing data
async function clearCollections() {
  log('Clearing existing collections...')
  
  const collections = [
    'users', 
    'projects', 
    'bankStatements',
    'bankPayments',
    'creditAwards',
    'pledges', 
    'historyActions'
  ]
  
  for (const collection of collections) {
    try {
      const snapshot = await db.collection(collection).get()
      
      const batch = db.batch()
      
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref)
      })
      
      if (snapshot.docs.length > 0) {
        await batch.commit()
        log(`✓ Cleared ${snapshot.docs.length} documents from ${collection}`)
      } else {
        log(`✓ Collection ${collection} is already empty`)
      }
    } catch (error) {
      logError(`Error clearing collection ${collection}:`, error)
    }
  }
}

// Populate users
async function populateUsers() {
  log('Populating users...')
  const { authUsers, userDocs } = generateUsers()
  
  // Create auth users
  for (const user of authUsers) {
    try {
      await auth.createUser(user)
      log(`✓ Created auth user: ${user.email}`)
    } catch (error) {
      logError(`Error creating auth user ${user.email}:`, error)
    }
  }
  
  // Create firestore user documents
  const batch = db.batch()
  userDocs.forEach(user => {
    const docRef = db.collection('users').doc(user.id)
    batch.set(docRef, user)
  })
  
  await batch.commit()
  log(`✓ Created ${userDocs.length} user documents`)
  
  return userDocs
}

// Populate projects
async function populateProjects(users: User[]) {
  log('Populating projects...')
  const projects = generateProjects(users)
  
  const batch = db.batch()
  projects.forEach(project => {
    const docRef = db.collection('projects').doc(project.id)
    batch.set(docRef, project)
  })
  
  await batch.commit()
  log(`✓ Created ${projects.length} projects`)
  
  return projects
}

// Populate bank statements
async function populateStatements() {
  log('Populating bank statements...')
  const statements = generateStatements()
  const batch = db.batch()
  
  statements.forEach(statement => {
    const docRef = db.collection('bankStatements').doc(statement.id)
    batch.set(docRef, statement)
  })
  
  await batch.commit()
  log(`✓ Created ${statements.length} bank statements`)
  
  return statements
}

// Populate payments
async function populatePayments(statements: BankStatement[], users: User[]) {
  log('Populating bank payments...')
  const payments = generatePayments(statements, users)
  
  const batchSize = 20
  try {
    for (let i = 0; i < payments.length; i += batchSize) {
      const currentBatch = db.batch()
      
      const batch = payments.slice(i, i + batchSize)
      batch.forEach(payment => {
        const docRef = db.collection('bankPayments').doc(payment.id)
        currentBatch.set(docRef, payment)
      })
      
      await currentBatch.commit()
      log(`✓ Created batch of payments: ${i + 1} to ${Math.min(i + batchSize, payments.length)}`)
    }
    
    log(`✓ Created total of ${payments.length} bank payments`)
  } catch (error) {
    logError(`Error creating bank payments:`, error)
  }
  
  return payments
}

// Populate credit awards
async function populateCreditAwards(users: User[]) {
  log('Populating credit awards...')
  const awards = generateCreditAwards(users)
  
  const batch = db.batch()
  awards.forEach(award => {
    const docRef = db.collection('creditAwards').doc(award.id)
    batch.set(docRef, award)
  })
  
  await batch.commit()
  log(`✓ Created ${awards.length} credit awards`)
  
  return awards
}

// Populate pledges
async function populatePledges(users: User[], projects: Project[]) {
  log('Populating pledges...')
  const pledges = generatePledges(users, projects)
  
  const batch = db.batch()
  pledges.forEach(pledge => {
    const docRef = db.collection('pledges').doc(pledge.id)
    batch.set(docRef, pledge)
  })
  
  await batch.commit()
  log(`✓ Created ${pledges.length} pledges`)
  
  return pledges
}

// Populate history actions
async function populateHistoryActions(users: User[], projects: Project[], pledges: Pledge[]) {
  log('Populating history actions...')
  const historyActions = generateHistoryActions(users, projects, pledges)
  
  // Split into smaller batches to avoid size limits
  const batchSize = 20
  for (let i = 0; i < historyActions.length; i += batchSize) {
    const currentBatch = db.batch()
    
    const batch = historyActions.slice(i, i + batchSize)
    batch.forEach(action => {
      const docRef = db.collection('historyActions').doc(action.id)
      currentBatch.set(docRef, action)
    })
    
    await currentBatch.commit()
    log(`✓ Created batch of history actions: ${i + 1} to ${Math.min(i + batchSize, historyActions.length)}`)
  }
  
  log(`✓ Created total of ${historyActions.length} history actions`)
  
  return historyActions
}

// Main function to initialize the entire database
async function initializeEmulator() {
  try {
    log('Starting Firebase emulator data population...')
    log('=============================================')
    
    await clearCollections()
    
    const users = await populateUsers()
    const projects = await populateProjects(users)
    const statements = await populateStatements()
    const awards = await populateCreditAwards(users)
    const pledges = await populatePledges(users, projects)
    const payments = await populatePayments(statements, users)
    const history = await populateHistoryActions(users, projects, pledges)
    
    log('=============================================')
    log('✓ Firebase emulator data population completed successfully!')
    log(`  - ${users.length} users`)
    log(`  - ${projects.length} projects`)
    log(`  - ${statements.length} bank statements`)
    log(`  - ${payments.length} bank payments`)
    log(`  - ${awards.length} credit awards`)
    log(`  - ${pledges.length} pledges`)
    log(`  - ${history.length} history actions`)
    
  } catch (error) {
    logError('Error populating emulator data:', error)
  } finally {
    process.exit(0)
  }
}

// Execute the initialization
initializeEmulator() 
})
.catch(error => {
  logError('Error populating emulator data:', error)
  process.exit(1)
})
