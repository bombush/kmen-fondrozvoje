import { BankPayment } from "@/types"

// Mock data - in real app, this would be your database
const payments: BankPayment[] = []
const pledges: any[] = []

// Service functions
export const getPaymentsForMonth = async (month: string): Promise<BankPayment[]> => 
  payments.filter(p => p.targetMonth === month)

export const updatePayment = async (id: string, data: Partial<BankPayment>): Promise<void> => {
  const index = payments.findIndex(p => p.id === id)
  if (index >= 0) {
    payments[index] = { ...payments[index], ...data }
  }
}

export const getUserPledges = async (userId: string) => 
  pledges.filter(p => p.userId === userId)

export const getMonthsWithPayments = async (): Promise<string[]> => 
  [...new Set(payments.map(p => p.targetMonth!))] 