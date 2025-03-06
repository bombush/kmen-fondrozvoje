export interface DataProvider {
  payments: PaymentDataProvider
  statements: StatementDataProvider
  pledges: PledgeDataProvider
}

export interface PaymentDataProvider {
  getForMonth: (month: string) => Promise<BankPayment[]>
  update: (id: string, data: Partial<BankPayment>) => Promise<void>
  getMonthsWithPayments: () => Promise<string[]>
}

export interface StatementDataProvider {
  update: (id: string, data: Partial<BankStatement>) => Promise<void>
}

export interface PledgeDataProvider {
  getForUser: (userId: string) => Promise<Pledge[]>
} 