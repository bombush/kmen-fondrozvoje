// Base document type for all database entities
export interface BaseDocument {
  id: string
  createdAt: string
  updatedAt: string
  deleted: boolean
}

// User types
export interface User extends BaseDocument {
  email: string
  name: string
  balance: number
  isAdmin: boolean
}

// Project types
export interface Project extends BaseDocument {
  name: string
  description: string
  targetAmount: number
  currentAmount: number
  status: 'open' | 'closed'
}

// Pledge types
export interface Pledge extends BaseDocument {
  userId: string
  projectId: string
  amount: number
  status: 'pending' | 'confirmed' | 'cancelled'
}

// Bank types
export interface BankStatement extends BaseDocument {
  month: string
  totalAmount: number
  processedAmount: number
  processedAt: string
  status: 'pending' | 'processed'
}

export interface BankPayment extends BaseDocument {
  userId: string
  amount: number
  statementId: string
  targetMonth: string
  status: 'pending' | 'processed'
  processedAt: string
  variableSymbol: string
  specificSymbol: string
  constantSymbol: string
  senderName: string
  senderAccount: string
  receivedAt: string
}

export type CreateInput<T extends BaseDocument> = Omit<T, keyof BaseDocument>
export type UpdateInput<T extends BaseDocument> = Partial<CreateInput<T>>

export type CreateUserInput = CreateInput<User>
export type CreateProjectInput = CreateInput<Project>
export type CreatePledgeInput = CreateInput<Pledge>
export type CreateBankStatementInput = CreateInput<BankStatement>
export type CreateBankPaymentInput = CreateInput<BankPayment>

export type UpdateUserInput = UpdateInput<User>
export type UpdateProjectInput = UpdateInput<Project>
export type UpdatePledgeInput = UpdateInput<Pledge>
export type UpdateBankStatementInput = UpdateInput<BankStatement>
export type UpdateBankPaymentInput = UpdateInput<BankPayment>
