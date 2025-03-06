import { BankPayment } from "@/types"
import { DataProvider } from '@/lib/data'

// Mock data
const mockPayments: BankPayment[] = []

// Service creator function
const createPaymentService = (dataProvider: DataProvider) => ({
  getPaymentsForMonth: (month: string) => 
    dataProvider.payments.getForMonth(month),

  updatePayment: (id: string, data: Partial<BankPayment>) =>
    dataProvider.payments.update(id, data),

  getUserPledges: (userId: string) =>
    dataProvider.pledges.getForUser(userId),

  getMonthsWithPayments: () =>
    dataProvider.payments.getMonthsWithPayments()
})

// Singleton instance with lazy initialization
let paymentService: ReturnType<typeof createPaymentService>

export const getPaymentService = () => {
  if (!paymentService) {
    // Switch providers here based on environment
    const provider = process.env.NEXT_PUBLIC_USE_MOCK_DATA 
      ? mockDataProvider
      : firebaseDataProvider
    paymentService = createPaymentService(provider)
  }
  return paymentService
}

// Individual function exports if preferred
export const getPaymentsForMonth = (month: string) =>
  getPaymentService().getPaymentsForMonth(month)

export const updatePayment = (id: string, data: Partial<BankPayment>) =>
  getPaymentService().updatePayment(id, data)

export const getUserPledges = (userId: string) =>
  getPaymentService().getUserPledges(userId)

export const getMonthsWithPayments = () =>
  getPaymentService().getMonthsWithPayments() 