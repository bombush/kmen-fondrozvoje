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

// @TODO: add field for JSON of payments
export type BankStatement = {
  id: string
  month: string // YYYY-MM format
  processedAt: string
  status: 'pending' | 'processed' | 'error'
  payments: string // JSON string of raw bank statement data
}

export type BankPayment = {
  id: string
  statementId: string
  userId: string // User who made the payment
  amount: number
  receivedAt: string
  description: string
  isVirtualParent: boolean
  virtualParentId?: string // References parent payment if this is a virtual split
  targetMonth?: string // Which month this payment (or split) contributes to
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
  | 'split_payment'
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