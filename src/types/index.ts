export type User = {
  id: string
  name: string
  email: string
  avatar?: string
  role: 'user' | 'admin'
  specificSymbol?:string
  variableSymbol?: string
  constantSymbol?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

//@TODO: what if specific symbol changes?

// @TODO: add field for JSON of payments
export type BankStatement = {
  id: string
  processedAt: string
  status: 'pending' | 'processed' | 'error'
  rawData: string // JSON string of raw bank statement data
  adapter: string // Name of the adapter used to parse the statement
  timestampOfStatement: number // date on the statement (Might not match the createdAt date)
  createdAt: string
  updatedAt: string
  deleted?: boolean
}

export type BankPayment = {
  id: string
  statementId: string
  userId: string // User who made the payment
  amount: number
  variableSymbol: string
  specificSymbol: string
  constantSymbol: string
  myAccountNumber: string
  myBankCode: string
  bankTransactionId: string // ID of the transaction in the bank statement
  counterpartyAccountNumber: string //including bank code
  counterpartyName: string
  receivedAt: string
  message: string // message to the receiver
  comment: string // internal comment
  isSplitFromId?: string // References parent payment if this is a virtual split
  targetMonth?: string // Which month this payment (or split) contributes to
  deleted?: boolean
  createdAt: string
  updatedAt: string
}

export type CreditAward = {
  id: string
  userId: string
  amount: number
  reason: 'monthly_allocation' | 'admin_award'
  sourceId?: string    // Could be projectId, paymentId, etc.
  sourceType?: string  // Could be "project", "payment", etc.
  notes?: string
  targetMonth?: string // For monthly allocations
  createdAt: string
  updatedAt: string
  deleted?: boolean
}

export type CreditAwardHistory = {
  id: string
  userId: string
  amount: number
  createdAt: string
  updatedAt: string
  originatingUserId?: string // Id of user who awarded credits
  description: string
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


export interface Project {
  id: string
  name: string
  description: string
  goal: number
  url?: string
  ownerId: string
  closed: boolean
  closedAt?: string
  fundsSentToOwner: boolean
  bought: boolean
  addedToAssetList: boolean
  locked: boolean
  deleted?: boolean
  createdAt: string
  updatedAt: string
}

export type Pledge = {
  id: string
  userId: string
  projectId: string
  amount: number
  createdAt: string
  updatedAt: string
  locked: boolean
  deleted?: boolean
  originatingUserId?: string
  description: string
}

export interface UpdateUserInput {
  name?: string
  email?: string
  specificSymbol?: string
  variableSymbol?: string
  constantSymbol?: string
  isActive?: boolean
}
