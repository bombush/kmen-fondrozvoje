export type User = {
  id: string
  name: string
  email: string
  avatar?: string
  role: 'user' | 'admin'
  balance: number // Can be negative
  createdAt: string
  updatedAt: string
}

export type BankStatement = {
  id: string
  month: string // YYYY-MM format
  uploadedAt: string
  processedAt?: string
  status: 'pending' | 'processed' | 'error'
  payments: BankPayment[]
}

export type PaymentDistribution = {
  id: string
  paymentId: string
  month: string // YYYY-MM format
  amount: number // Portion of payment amount distributed to this month
  createdAt: string
  createdById: string
}

export type BankPayment = {
  id: string
  statementId: string
  userId: string // User who made the payment
  amount: number
  receivedAt: string
  description: string
  distributions: PaymentDistribution[] // Track distribution across months
}

export type CreditAward = {
  id: string
  userId: string // User receiving credits
  amount: number // Amount of credits awarded
  source: 'bank_distribution' | 'manual' | 'system'
  sourceId?: string // Reference to BankStatement for bank_distribution
  awardedById: string // User who awarded the credits (for manual) or system
  reason?: string // Optional reason for the award
  createdAt: string
}

export type MonthlyDistribution = {
  month: string // YYYY-MM format
  totalAmount: number // Total amount distributed
  contributorCount: number // Number of users who contributed
  creditPerContributor: number // Amount each contributor received
  processedAt: string
}

// History action types
export type HistoryActionType = 
  | 'create_project' 
  | 'update_project'
  | 'delete_project'
  | 'create_pledge'
  | 'update_pledge'
  | 'delete_pledge'
  | 'process_bank_statement'
  | 'distribute_payment'
  | 'award_credits'

export type HistoryAction = {
  id: string
  type: HistoryActionType
  entityId: string
  userId: string
  data: {
    before?: any
    after?: any
  }
  createdAt: string
} 