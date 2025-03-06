import { BankStatement, BankPayment } from "@/types"

// Mock data
const mockStatements: BankStatement[] = [
  {
    id: "stmt_1",
    month: "2024-01",
    processedAt: "2024-01-31T12:00:00Z",
    status: "processed",
    payments: JSON.stringify([
      {
        userId: "user_1",
        amount: 1000,
        receivedAt: "2024-01-15T10:30:00Z",
        description: "January contribution"
      }
    ])
  },
  {
    id: "stmt_2",
    month: "2024-02",
    processedAt: "2024-02-29T12:00:00Z",
    status: "pending",
    payments: JSON.stringify([
      {
        userId: "user_1",
        amount: 2000,
        receivedAt: "2024-02-15T14:20:00Z",
        description: "February contribution"
      },
      {
        userId: "user_2",
        amount: 1500,
        receivedAt: "2024-02-16T09:15:00Z",
        description: "First contribution"
      }
    ])
  }
]

const mockPayments: BankPayment[] = [
  {
    id: "pmt_1",
    statementId: "stmt_1",
    userId: "user_1",
    amount: 1000,
    receivedAt: "2024-01-15T10:30:00Z",
    message: "January contribution",
    variableSymbol: "12345",
    specificSymbol: "",
    constantSymbol: "",
    bankTransactionId: "tx_1",
    counterpartyAccountNumber: "1234567890/0100",
    counterpartyName: "John Doe",
    comment: ""
  },
  {
    id: "pmt_2",
    statementId: "stmt_2",
    userId: "user_1",
    amount: 2000,
    receivedAt: "2024-02-15T14:20:00Z",
    message: "February contribution",
    variableSymbol: "12346",
    specificSymbol: "",
    constantSymbol: "",
    bankTransactionId: "tx_2",
    counterpartyAccountNumber: "1234567890/0100",
    counterpartyName: "John Doe",
    comment: ""
  }
]

// Service interface
export interface BankService {
  getStatements(): Promise<BankStatement[]>
  getStatement(id: string): Promise<BankStatement | null>
  getPaymentsForStatement(statementId: string): Promise<BankPayment[]>
  createVirtualPayments(
    parentId: string, 
    splits: Array<{ amount: number; targetMonth: string }>
  ): Promise<BankPayment[]>
}

// Mock implementation
export class MockBankService implements BankService {
  async getStatements(): Promise<BankStatement[]> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500))
    return [...mockStatements]
  }

  async getStatement(id: string): Promise<BankStatement | null> {
    await new Promise(resolve => setTimeout(resolve, 500))
    return mockStatements.find(s => s.id === id) || null
  }

  async getPaymentsForStatement(statementId: string): Promise<BankPayment[]> {
    await new Promise(resolve => setTimeout(resolve, 500))
    return mockPayments.filter(p => p.statementId === statementId)
  }

  async createVirtualPayments(
    parentId: string,
    splits: Array<{ amount: number; targetMonth: string }>
  ): Promise<BankPayment[]> {
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const parent = mockPayments.find(p => p.id === parentId)
    if (!parent) throw new Error("Payment not found")

    const virtualPayments = splits.map((split, index) => ({
      id: `pmt_virtual_${parentId}_${index}`,
      statementId: parent.statementId,
      userId: parent.userId,
      amount: split.amount,
      receivedAt: parent.receivedAt,
      message: `Split from payment ${parentId}`,
      variableSymbol: parent.variableSymbol,
      specificSymbol: parent.specificSymbol,
      constantSymbol: parent.constantSymbol,
      bankTransactionId: parent.bankTransactionId,
      counterpartyAccountNumber: parent.counterpartyAccountNumber,
      counterpartyName: parent.counterpartyName,
      comment: `Virtual payment split from ${parentId}`,
      targetMonth: split.targetMonth
    }))

    // In a real implementation, we would persist these
    mockPayments.push(...virtualPayments)
    
    return virtualPayments
  }
}

// Service factory
let bankService: BankService

export function getBankService(): BankService {
  if (!bankService) {
    // Here we could switch between mock and real implementation
    bankService = new MockBankService()
  }
  return bankService
} 