/**
 * Firebase Emulator Initialization Script
 * 
 * This script populates the Firebase emulators with sample data for development.
 * Run with: ts-node scripts/populate-emulator.ts
 */
// At the top of your populate-emulator.ts
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099'
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080'

import * as admin from 'firebase-admin'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

// Initialize Firebase Admin SDK
const serviceAccount = {
  projectId: 'my-project-id', // Can be any string in emulator
  privateKey: 'fake-key',
  clientEmail: 'fake@example.com',
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as any),
  databaseURL: 'http://localhost:8080',
  projectId: 'my-project-id',
})

const auth = getAuth()
const db = getFirestore()

// Clear any existing data first
async function clearCollections() {
  const collections = ['users', 'projects', 'payments', 'statements']
  
  for (const collection of collections) {
    const snapshot = await db.collection(collection).get()
    const batch = db.batch()
    
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref)
    })
    
    await batch.commit()
    console.log(`Cleared collection: ${collection}`)
  }
}

// Create sample users
async function createUsers() {
  const users = [
    {
      uid: 'user-001',
      email: 'admin@example.com',
      password: 'password123',
      displayName: 'Admin User',
      emailVerified: true,
      disabled: false,
    },
    {
      uid: 'user-002',
      email: 'user1@example.com',
      password: 'password123',
      displayName: 'User One',
      emailVerified: true,
      disabled: false,
    },
    {
      uid: 'user-003',
      email: 'user2@example.com',
      password: 'password123',
      displayName: 'User Two',
      emailVerified: true,
      disabled: false,
    },
    {
      uid: 'user-004',
      email: 'inactive@example.com',
      password: 'password123',
      displayName: 'Inactive User',
      emailVerified: true,
      disabled: true,
    },
  ]

  for (const user of users) {
    try {
      await auth.createUser(user)
      console.log(`Created auth user: ${user.email}`)
      
      // Create corresponding user document in Firestore
      await db.collection('users').doc(user.uid).set({
        id: user.uid,
        name: user.displayName,
        email: user.email,
        role: user.email === 'admin@example.com' ? 'admin' : 'user',
        isActive: !user.disabled,
        specificSymbol: `SS${user.uid.substring(5)}`,
        variableSymbol: `VS${user.uid.substring(5)}`,
        constantSymbol: `CS${user.uid.substring(5)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      console.log(`Created user document: ${user.email}`)
    } catch (error) {
      console.error(`Error creating user ${user.email}:`, error)
    }
  }
}

// Create sample projects
async function createProjects() {
  const projects = [
    {
      id: 'project-001',
      name: 'Sample Project 1',
      description: 'This is a sample project for development',
      goal: 50000,
      closed: false,
      ownerId: 'user-002',
      url: 'https://example.com/project1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'project-002',
      name: 'Sample Project 2',
      description: 'Another sample project for testing',
      goal: 30000,
      closed: false,
      ownerId: 'user-003',
      url: 'https://example.com/project2',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'project-003',
      name: 'Completed Project',
      description: 'This project has been completed',
      goal: 10000,
      closed: true,
      ownerId: 'user-002',
      url: 'https://example.com/project3',
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
      updatedAt: new Date().toISOString(),
    },
  ]

  const batch = db.batch()
  
  projects.forEach((project) => {
    const docRef = db.collection('projects').doc(project.id)
    batch.set(docRef, project)
  })
  
  await batch.commit()
  console.log(`Created ${projects.length} projects`)
}

// Create sample payments
async function createPayments() {
  const months = ['2025-01', '2025-02', '2025-03']
  const payments = []
  
  // Generate regular payments
  for (let i = 1; i <= 15; i++) {
    const userId = `user-00${(i % 4) + 1}`
    const monthIndex = i % 3
    const amount = Math.floor(Math.random() * 4000) + 1000
    
    payments.push({
      id: `pay-${i.toString().padStart(3, '0')}`,
      statementId: `stmt-${months[monthIndex]}`,
      userId,
      amount,
      variableSymbol: `VS${i.toString().padStart(6, '0')}`,
      specificSymbol: i % 2 === 0 ? `SS${i.toString().padStart(6, '0')}` : '',
      constantSymbol: i % 3 === 0 ? '0308' : '',
      bankTransactionId: `tr-${i.toString().padStart(5, '0')}`,
      counterpartyAccountNumber: `${Math.floor(Math.random() * 1000000000)}/${Math.floor(Math.random() * 10000)}`,
      counterpartyName: `User ${i}`,
      receivedAt: new Date(Date.now() - (30 - i) * 24 * 60 * 60 * 1000).toISOString(),
      message: `Payment for ${months[monthIndex]}`,
      comment: i % 4 === 0 ? 'Special payment' : '',
      targetMonth: months[monthIndex],
      createdAt: new Date(Date.now() - (30 - i) * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - (30 - i) * 24 * 60 * 60 * 1000).toISOString(),
    })
  }
  
  // Add a split payment example
  const parentPayment = {
    id: 'pay-split-parent',
    statementId: 'stmt-2025-03',
    userId: 'user-001',
    amount: 5000,
    variableSymbol: 'VS000099',
    specificSymbol: 'SS000099',
    constantSymbol: '0308',
    bankTransactionId: 'tr-99999',
    counterpartyAccountNumber: '9876543210/0300',
    counterpartyName: 'Split Payment User',
    receivedAt: new Date().toISOString(),
    message: 'Payment to be split',
    comment: 'Original payment before splitting',
    targetMonth: '2025-03',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  
  const splitPayment1 = {
    ...parentPayment,
    id: 'pay-split-child-1',
    amount: 3000,
    message: 'Split payment part 1',
    comment: 'First part of split payment',
    isSplitFromId: 'pay-split-parent',
  }
  
  const splitPayment2 = {
    ...parentPayment,
    id: 'pay-split-child-2',
    amount: 2000,
    message: 'Split payment part 2',
    comment: 'Second part of split payment',
    isSplitFromId: 'pay-split-parent',
  }
  
  payments.push(parentPayment, splitPayment1, splitPayment2)
  
  const batch = db.batch()
  
  payments.forEach((payment) => {
    const docRef = db.collection('payments').doc(payment.id)
    batch.set(docRef, payment)
  })
  
  await batch.commit()
  console.log(`Created ${payments.length} payments`)
}

// Create bank statements
async function createStatements() {
  const statements = [
    {
      id: 'stmt-2025-01',
      month: '2025-01',
      filename: 'statement-2025-01.csv',
      importedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'stmt-2025-02',
      month: '2025-02',
      filename: 'statement-2025-02.csv',
      importedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'stmt-2025-03',
      month: '2025-03',
      filename: 'statement-2025-03.csv',
      importedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]

  const batch = db.batch()
  
  statements.forEach((statement) => {
    const docRef = db.collection('statements').doc(statement.id)
    batch.set(docRef, statement)
  })
  
  await batch.commit()
  console.log(`Created ${statements.length} statements`)
}

// Run all initialization functions
async function initializeEmulator() {
  try {
    console.log('Starting emulator data initialization...')
    
    await clearCollections()
    await createUsers()
    await createProjects()
    await createStatements()
    await createPayments()
    
    console.log('Emulator data initialization completed successfully!')
  } catch (error) {
    console.error('Error initializing emulator data:', error)
  } finally {
    process.exit(0)
  }
}

// Execute the script
initializeEmulator() 