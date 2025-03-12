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
import { User, Project, BankStatement, BankPayment, CreditAward, Pledge, HistoryAction } from '@/types'
// Initialize Firebase Admin SDK
const serviceAccount = {
  projectId: 'dev-project', // Can be any string in emulator
  privateKey: 'fake-key',
  clientEmail: 'fake@example.com',
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as any),
})

const auth = getAuth()
const db = getFirestore()

// Clear existing data
async function clearCollections() {
  console.log('Clearing existing collections...')
  
  const collections = [
    'users', 
    'projects', 
    'payments', 
    'statements', 
    'pledges', 
    'creditAwards',
    'creditAwardHistory',
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
        console.log(`✓ Cleared ${snapshot.docs.length} documents from ${collection}`)
      } else {
        console.log(`✓ Collection ${collection} is already empty`)
      }
    } catch (error) {
      console.error(`Error clearing collection ${collection}:`, error)
    }
  }
}

// Populate users
async function populateUsers() {
  console.log('Populating users...')
  const { authUsers, userDocs } = generateUsers()
  
  // Create auth users
  for (const user of authUsers) {
    try {
      await auth.createUser(user)
      console.log(`✓ Created auth user: ${user.email}`)
    } catch (error) {
      console.error(`Error creating auth user ${user.email}:`, error)
    }
  }
  
  // Create firestore user documents
  const batch = db.batch()
  userDocs.forEach(user => {
    const docRef = db.collection('users').doc(user.id)
    batch.set(docRef, user)
  })
  
  await batch.commit()
  console.log(`✓ Created ${userDocs.length} user documents`)
  
  return userDocs
}

// Populate projects
async function populateProjects(users: User[]) {
  console.log('Populating projects...')
  const projects = generateProjects(users)
  
  const batch = db.batch()
  projects.forEach(project => {
    const docRef = db.collection('projects').doc(project.id)
    batch.set(docRef, project)
  })
  
  await batch.commit()
  console.log(`✓ Created ${projects.length} projects`)
  
  return projects
}

// Populate bank statements
async function populateStatements() {
  console.log('Populating bank statements...')
  const statements = generateStatements()
  
  const batch = db.batch()
  statements.forEach(statement => {
    const docRef = db.collection('statements').doc(statement.id)
    batch.set(docRef, statement)
  })
  
  await batch.commit()
  console.log(`✓ Created ${statements.length} bank statements`)
  
  return statements
}

// Populate payments
async function populatePayments(statements: BankStatement[], users: User[]) {
  console.log('Populating payments...')
  const payments = generatePayments(statements, users)
  
  const batchSize = 20
  for (let i = 0; i < payments.length; i += batchSize) {
    const currentBatch = db.batch()
    
    const batch = payments.slice(i, i + batchSize)
    batch.forEach(payment => {
      const docRef = db.collection('payments').doc(payment.id)
      currentBatch.set(docRef, payment)
    })
    
    await currentBatch.commit()
    console.log(`✓ Created batch of payments: ${i + 1} to ${Math.min(i + batchSize, payments.length)}`)
  }
  
  console.log(`✓ Created total of ${payments.length} payments`)
  
  return payments
}

// Populate credit awards
async function populateCreditAwards(users: User[]) {
  console.log('Populating credit awards...')
  const awards = generateCreditAwards(users)
  
  const batch = db.batch()
  awards.forEach(award => {
    const docRef = db.collection('creditAwards').doc(award.id)
    batch.set(docRef, award)
  })
  
  await batch.commit()
  console.log(`✓ Created ${awards.length} credit awards`)
  
  return awards
}

// Populate pledges
async function populatePledges(users: User[], projects: Project[]) {
  console.log('Populating pledges...')
  const pledges = generatePledges(users, projects)
  
  const batch = db.batch()
  pledges.forEach(pledge => {
    const docRef = db.collection('pledges').doc(pledge.id)
    batch.set(docRef, pledge)
  })
  
  await batch.commit()
  console.log(`✓ Created ${pledges.length} pledges`)
  
  return pledges
}

// Populate history actions
async function populateHistoryActions(users: User[], projects: Project[], pledges: Pledge[]) {
  console.log('Populating history actions...')
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
    console.log(`✓ Created batch of history actions: ${i + 1} to ${Math.min(i + batchSize, historyActions.length)}`)
  }
  
  console.log(`✓ Created total of ${historyActions.length} history actions`)
  
  return historyActions
}

// Main function to initialize the entire database
async function initializeEmulator() {
  try {
    console.log('Starting Firebase emulator data population...')
    console.log('=============================================')
    
    await clearCollections()
    
    const users = await populateUsers()
    const projects = await populateProjects(users)
    const statements = await populateStatements()
    const awards = await populateCreditAwards(users)
    const pledges = await populatePledges(users, projects)
    const payments = await populatePayments(statements, users)
    const history = await populateHistoryActions(users, projects, pledges)
    
    console.log('=============================================')
    console.log('✓ Firebase emulator data population completed successfully!')
    console.log(`  - ${users.length} users`)
    console.log(`  - ${projects.length} projects`)
    console.log(`  - ${statements.length} bank statements`)
    console.log(`  - ${payments.length} payments`)
    console.log(`  - ${awards.length} credit awards`)
    console.log(`  - ${pledges.length} pledges`)
    console.log(`  - ${history.length} history actions`)
    
  } catch (error) {
    console.error('Error populating emulator data:', error)
  } finally {
    process.exit(0)
  }
}

// Execute the initialization
initializeEmulator() 