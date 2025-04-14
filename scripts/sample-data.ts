/**
 * Sample data for Firebase emulator
 * This file contains all the sample data objects used to populate the emulator
 */

import { 
  User, BankStatement, BankPayment, Project, Pledge, 
  CreditAward, HistoryAction, HistoryActionType 
} from '../src/types'

// Generate timestamp for a date offset in days
const getDateISOString = (daysOffset = 0) => {
  const date = new Date()
  date.setDate(date.getDate() - daysOffset)
  return date.toISOString()
}

const getTimestamp = (daysOffset = 0) => {
  const date = new Date()
  date.setDate(date.getDate() - daysOffset)
  return date.getTime()
}

// Generate sample users
export const generateUsers = () => {
  const authUsers = [
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
      email: 'johndoe@example.com',
      password: 'password123',
      displayName: 'John Doe',
      emailVerified: true,
      disabled: false,
    },
    {
      uid: 'user-003',
      email: 'janesmith@example.com',
      password: 'password123',
      displayName: 'Jane Smith',
      emailVerified: true,
      disabled: false,
    },
    {
      uid: 'user-004',
      email: 'bobmartin@example.com',
      password: 'password123',
      displayName: 'Bob Martin',
      emailVerified: true,
      disabled: false,
    },
    {
      uid: 'user-005',
      email: 'alice@example.com',
      password: 'password123',
      displayName: 'Alice Johnson',
      emailVerified: true,
      disabled: true,
    }
  ]
  
  const userDocs: User[] = authUsers.map(user => ({
    id: user.uid,
    name: user.displayName,
    email: user.email,
    role: user.uid === 'user-001' ? 'admin' : 'user',
    isActive: !user.disabled,
    specificSymbol: `${parseInt(user.uid.split('-')[1]) * 1000000000}`,
    variableSymbol: `${parseInt(user.uid.split('-')[1]) * 2000000000}`,
    constantSymbol: '0308',
    createdAt: getDateISOString(90),
    updatedAt: getDateISOString(90),
    bankCode: `${Math.floor(Math.random() * 10000)}`,
    accountNumber: `${Math.floor(Math.random() * 10000000000)}`
  }))
  
  return { authUsers, userDocs }
}

// Generate sample projects
export const generateProjects = (users: User[]): Project[] => {
  return [
    {
      id: 'project-001',
      name: 'Community Garden',
      description: 'Create a garden for the local community to grow vegetables and flowers.',
      url: 'https://example.com/community-garden',
      goal: 10000,
      ownerId: users[1].id,
      closed: false,
      createdAt: getDateISOString(60),
      updatedAt: getDateISOString(60),
      deleted: false,
      fundsSentToOwner: false,
      bought: false,
      addedToAssetList: false,
      locked: false
    },
    {
      id: 'project-002',
      name: 'Tech Workshop',
      description: 'Workshop for teaching programming to kids and teenagers.',
      goal: 5000,
      ownerId: users[2].id,
      closed: false,
      createdAt: getDateISOString(45),
      updatedAt: getDateISOString(45),
      deleted: false
    },
    {
      id: 'project-003',
      name: 'Hiking Trail Cleanup',
      description: 'Organize a cleanup event for the local hiking trails.',
      goal: 3000,
      ownerId: users[3].id,
      closed: true,
      closedAt: getDateISOString(10),
      createdAt: getDateISOString(30),
      updatedAt: getDateISOString(10),
      deleted: false
    },
    {
      id: 'project-004',
      name: 'Art Exhibition',
      description: 'Exhibition showcasing local artists and their work.',
      goal: 8000,
      ownerId: users[2].id,
      closed: false,
      createdAt: getDateISOString(20),
      updatedAt: getDateISOString(20),
      deleted: false
    },
    {
      id: 'project-005',
      name: 'Canceled Project',
      description: 'This project was canceled and marked as deleted.',
      goal: 2000,
      ownerId: users[1].id,
      closed: false,
      createdAt: getDateISOString(15),
      updatedAt: getDateISOString(5),
      deleted: true
    }
  ]
}

// Generate sample bank statements
export const generateStatements = (): BankStatement[] => {
  return [
    {
      id: 'stmt-2025-01',
      month: '2025-01',
      status: 'processed',
      processedAt: getDateISOString(60),
      rawData: JSON.stringify([]), // This will be populated separately
      createdAt: getDateISOString(60),
      updatedAt: getDateISOString(60),
    },
    {
      id: 'stmt-2025-02',
      month: '2025-02',
      status: 'processed',
      processedAt: getDateISOString(30),
      rawData: JSON.stringify([]),
      createdAt: getDateISOString(30),
      updatedAt: getDateISOString(30),
    },
    {
      id: 'stmt-2025-03',
      month: '2025-03',
      status: 'processed',
      processedAt: getDateISOString(1),
      rawData: JSON.stringify([]),
      createdAt: getDateISOString(1),
      updatedAt: getDateISOString(1),
    },
    {
      id: 'stmt-2025-04',
      month: '2025-04',
      status: 'pending',
      processedAt: null as any,
      rawData: JSON.stringify([]),
      createdAt: getDateISOString(0),
      updatedAt: getDateISOString(0),
    }
  ]
}

// Generate sample payments
export const generatePayments = (statements: BankStatement[], users: User[]): BankPayment[] => {
  // Create a function to generate a standard payment
  const createPayment = (
    id: string, 
    statementId: string, 
    userId: string, 
    amount: number, 
    daysAgo: number,
    targetMonth: string,
    isSplitFromId?: string
  ): BankPayment => ({
    id,
    statementId,
    userId,
    amount,
    variableSymbol: users.find(u => u.id === userId)?.variableSymbol || '',
    specificSymbol: users.find(u => u.id === userId)?.specificSymbol || '',
    constantSymbol: '0308',
    bankTransactionId: `bank-${id}`,
    counterpartyAccountNumber: '123456789/0100',
    counterpartyName: users.find(u => u.id === userId)?.name || 'Unknown',
    receivedAt: getDateISOString(daysAgo),
    message: `Payment from ${users.find(u => u.id === userId)?.name}`,
    comment: `Monthly contribution for ${targetMonth}`,
    targetMonth: targetMonth,
    deleted: false,
    createdAt: getDateISOString(daysAgo),
    updatedAt: getDateISOString(daysAgo),
    myAccountNumber: '123456789',
    myBankCode: '0308',
    receivedAtTimestamp: getTimestamp(daysAgo)
  })

  // Create regular payments
  const payments: BankPayment[] = [
    // January payments
    createPayment('pay-001', 'stmt-2025-01', users[1].id, 1000, 60, '2025-01'),
    createPayment('pay-002', 'stmt-2025-01', users[2].id, 1500, 58, '2025-01'),
    createPayment('pay-003', 'stmt-2025-01', users[3].id, 2000, 55, '2025-01'),
    
    // February payments
    createPayment('pay-004', 'stmt-2025-02', users[1].id, 1000, 30, '2025-02'),
    createPayment('pay-005', 'stmt-2025-02', users[2].id, 1500, 28, '2025-02'),
    createPayment('pay-006', 'stmt-2025-02', users[3].id, 2000, 26, '2025-02'),
    
    // March payments
    createPayment('pay-007', 'stmt-2025-03', users[1].id, 1000, 8, '2025-03'),
    createPayment('pay-008', 'stmt-2025-03', users[2].id, 1500, 7, '2025-03'),
    createPayment('pay-009', 'stmt-2025-03', users[3].id, 2000, 5, '2025-03')
  ]
  
  // Add a parent payment for split demo
  const parentPayment = createPayment('pay-split-parent', 'stmt-2025-02', users[1].id, 5000, 5, '2025-02')
  
  // Add split payments
  const splitPayment1 = createPayment('pay-split-child-1', 'stmt-2025-02', users[1].id, 3000, 4, '2025-03', 'pay-split-parent')
  const splitPayment2 = createPayment('pay-split-child-2', 'stmt-2025-02', users[1].id, 2000, 4, '2025-04', 'pay-split-parent')
  
  // Combine all payments
  return [...payments, parentPayment, splitPayment1, splitPayment2]
}

// Generate sample credit awards
export const generateCreditAwards = (users: User[]): CreditAward[] => {
  return [
    // Monthly allocations
    ...users.filter(u => u.isActive).flatMap((user, index) => ([
      {
        id: `award-monthly-${user.id}-01`,
        userId: user.id,
        amount: 1000,
        reason: 'monthly_allocation' as const,
        targetMonth: '2025-01',
        notes: 'Monthly credit allocation for January 2025',
        createdAt: getDateISOString(60),
        updatedAt: getDateISOString(60),
        deleted: false
      },
      {
        id: `award-monthly-${user.id}-02`,
        userId: user.id,
        amount: 1000,
        reason: 'monthly_allocation' as const,
        targetMonth: '2025-02',
        notes: 'Monthly credit allocation for February 2025',
        createdAt: getDateISOString(30),
        updatedAt: getDateISOString(30),
        deleted: false
      },
      {
        id: `award-monthly-${user.id}-03`,
        userId: user.id,
        amount: 1000,
        reason: 'monthly_allocation' as const,
        targetMonth: '2025-03',
        notes: 'Monthly credit allocation for March 2025',
        createdAt: getDateISOString(1),
        updatedAt: getDateISOString(1),
        deleted: false
      }
    ])),
    
    // Special awards
    {
      id: 'award-special-001',
      userId: users[1].id,
      amount: 2000,
      reason: 'admin_award' as const,
      notes: 'Bonus for community engagement',
      createdAt: getDateISOString(15),
      updatedAt: getDateISOString(15),
      deleted: false
    },
    {
      id: 'award-special-002',
      userId: users[2].id,
      amount: 1500,
      reason: 'admin_award' as const,
      notes: 'Award for organizing workshops',
      createdAt: getDateISOString(10),
      updatedAt: getDateISOString(10),
      deleted: false
    }
  ]
}

// Generate sample pledges
export const generatePledges = (users: User[], projects: Project[]): Pledge[] => {
  const timestamp = new Date().toISOString()
  
  return [
    // Pledges for Community Garden (project-001)
    {
      id: 'pledge-001',
      userId: users[1].id,
      projectId: projects[0].id,
      amount: 3000,
      locked: false,
      createdAt: getDateISOString(50),
      updatedAt: getDateISOString(50),
      deleted: false,
      description: 'Supporting community garden'
    },
    {
      id: 'pledge-002',
      userId: users[2].id,
      projectId: projects[0].id,
      amount: 2000,
      locked: false,
      createdAt: getDateISOString(48),
      updatedAt: getDateISOString(48),
      deleted: false,
      description: 'For community garden tools'
    },
    
    // Pledges for Tech Workshop (project-002)
    {
      id: 'pledge-003',
      userId: users[1].id,
      projectId: projects[1].id,
      amount: 1500,
      locked: false,
      createdAt: getDateISOString(40),
      updatedAt: getDateISOString(40),
      deleted: false,
      description: 'Supporting tech education'
    },
    {
      id: 'pledge-004',
      userId: users[3].id,
      projectId: projects[1].id,
      amount: 2500,
      locked: false,
      createdAt: getDateISOString(38),
      updatedAt: getDateISOString(38),
      deleted: false,
      description: 'For programming equipment'
    },
    
    // Pledges for Hiking Trail Cleanup (project-003, closed)
    {
      id: 'pledge-005',
      userId: users[2].id,
      projectId: projects[2].id,
      amount: 1000,
      locked: true, // Locked because project is closed
      createdAt: getDateISOString(25),
      updatedAt: getDateISOString(10),
      deleted: false,
      description: 'For cleanup supplies'
    },
    {
      id: 'pledge-006',
      userId: users[3].id,
      projectId: projects[2].id,
      amount: 2000,
      locked: true, // Locked because project is closed
      createdAt: getDateISOString(22),
      updatedAt: getDateISOString(10),
      deleted: false,
      description: 'Supporting trail maintenance'
    },
    
    // Pledges for Art Exhibition (project-004)
    {
      id: 'pledge-007',
      userId: users[1].id,
      projectId: projects[3].id,
      amount: 3000,
      locked: false,
      createdAt: getDateISOString(18),
      updatedAt: getDateISOString(18),
      deleted: false,
      description: 'Supporting local artists'
    },
    
    // Deleted pledge
    {
      id: 'pledge-008',
      userId: users[3].id,
      projectId: projects[3].id,
      amount: 1000,
      locked: false,
      createdAt: getDateISOString(17),
      updatedAt: getDateISOString(12),
      deleted: true,
      description: 'Canceled pledge'
    }
  ]
}

// Generate history actions
export const generateHistoryActions = (
  users: User[], 
  projects: Project[], 
  pledges: Pledge[]
): HistoryAction[] => {
  return [
    // Project creation history
    ...projects.map(project => ({
      id: `history-project-create-${project.id}`,
      type: 'create_project' as HistoryActionType,
      entityId: project.id,
      userId: project.ownerId,
      data: {
        after: {
          name: project.name,
          description: project.description,
          goal: project.goal
        }
      },
      createdAt: project.createdAt
    })),
    
    // Project update history
    {
      id: 'history-project-update-001',
      type: 'update_project' as HistoryActionType,
      entityId: projects[0].id,
      userId: projects[0].ownerId,
      data: {
        before: { description: 'Create a garden.' },
        after: { description: projects[0].description }
      },
      createdAt: getDateISOString(55)
    },
    
    // Project closing history
    {
      id: 'history-project-close-001',
      type: 'update_project' as HistoryActionType,
      entityId: projects[2].id,
      userId: projects[2].ownerId,
      data: {
        before: { closed: false },
        after: { closed: true, closedAt: projects[2].closedAt }
      },
      createdAt: projects[2].closedAt || getDateISOString(10)
    },
    
    // Pledge creation history
    ...pledges.filter(p => !p.deleted).map(pledge => ({
      id: `history-pledge-create-${pledge.id}`,
      type: 'create_pledge' as HistoryActionType,
      entityId: pledge.id,
      userId: pledge.userId,
      data: {
        after: {
          projectId: pledge.projectId,
          amount: pledge.amount,
          description: pledge.description
        }
      },
      createdAt: pledge.createdAt
    })),
    
    // Pledge locking history (for closed project)
    ...pledges.filter(p => p.locked).map(pledge => ({
      id: `history-pledge-lock-${pledge.id}`,
      type: 'update_pledge' as HistoryActionType,
      entityId: pledge.id,
      userId: users[0].id, // Admin user
      data: {
        before: { locked: false },
        after: { locked: true }
      },
      createdAt: pledge.updatedAt
    })),
    
    // Bank statement processing
    {
      id: 'history-statement-process-001',
      type: 'process_bank_statement' as HistoryActionType,
      entityId: 'stmt-2025-01',
      userId: users[0].id, // Admin user
      data: {
        after: { id: 'stmt-2025-01', status: 'processed' }
      },
      createdAt: getDateISOString(60)
    },
    {
      id: 'history-statement-process-002',
      type: 'process_bank_statement' as HistoryActionType,
      entityId: 'stmt-2025-02',
      userId: users[0].id, // Admin user
      data: {
        after: { id: 'stmt-2025-02', status: 'processed' }
      },
      createdAt: getDateISOString(30)
    },
    {
      id: 'history-statement-process-003',
      type: 'process_bank_statement' as HistoryActionType,
      entityId: 'stmt-2025-03',
      userId: users[0].id, // Admin user
      data: {
        after: { id: 'stmt-2025-03', status: 'processed' }
      },
      createdAt: getDateISOString(1)
    },
    
    // Payment split action
    {
      id: 'history-payment-split-001',
      type: 'split_payment' as HistoryActionType,
      entityId: 'pay-split-parent',
      userId: users[0].id, // Admin user
      data: {
        before: { id: 'pay-split-parent', amount: 5000 },
        after: {
          parent: { id: 'pay-split-parent', amount: 5000 },
          children: [
            { id: 'pay-split-child-1', amount: 3000, targetMonth: '2025-03' },
            { id: 'pay-split-child-2', amount: 2000, targetMonth: '2025-04' }
          ]
        }
      },
      createdAt: getDateISOString(4)
    },
    
    // Credit awards
    {
      id: 'history-credit-award-001',
      type: 'award_credits' as HistoryActionType,
      entityId: 'award-special-001',
      userId: users[0].id, // Admin user
      data: {
        after: {
          userId: users[1].id,
          amount: 2000,
          reason: 'admin_award',
          notes: 'Bonus for community engagement'
        }
      },
      createdAt: getDateISOString(15)
    }
  ]
} 