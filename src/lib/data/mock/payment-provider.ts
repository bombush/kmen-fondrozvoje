import { PaymentDataProvider } from '../types'
import { BankPayment } from '@/types'

const mockPayments: BankPayment[] = []

export const mockPaymentProvider: PaymentDataProvider = {
  getForMonth: async (month: string) => 
    mockPayments.filter(p => p.targetMonth === month),

  update: async (id: string, data: Partial<BankPayment>) => {
    const index = mockPayments.findIndex(p => p.id === id)
    if (index >= 0) {
      mockPayments[index] = { ...mockPayments[index], ...data }
    }
  },

  getMonthsWithPayments: async () => 
    [...new Set(mockPayments.map(p => p.targetMonth!))]
} 