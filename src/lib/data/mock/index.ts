import { DataProvider } from '../types'
import { mockPaymentProvider } from './payment-provider'
import { mockStatementProvider } from './statement-provider'
import { mockPledgeProvider } from './pledge-provider'

export const mockDataProvider: DataProvider = {
  payments: mockPaymentProvider,
  statements: mockStatementProvider,
  pledges: mockPledgeProvider
} 