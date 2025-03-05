import { BankPayment } from "@/types"

// Mock data
const mockPayments: BankPayment[] = []

export const getPaymentsForMonth = async (month: string): Promise<BankPayment[]> => {
  return mockPayments.filter(p => p.targetMonth === month)
}

export const updatePayment = async (id: string, update: Partial<BankPayment>): Promise<void> => {
  const index = mockPayments.findIndex(p => p.id === id)
  if (index >= 0) {
    mockPayments[index] = { ...mockPayments[index], ...update }
  }
}

export const getUserPledges = async (userId: string) => {
  return [] // Mock pledges
}

export const getMonthsWithPayments = async (): Promise<string[]> => {
  return [...new Set(mockPayments.map(p => p.targetMonth!))]
} 