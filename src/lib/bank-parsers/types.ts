export type RawBankPayment = {
  userId: string
  amount: number
  receivedAt: string
  description: string   
  variableSymbol: string
  specificSymbol: string
  constantSymbol: string
  bankTransactionId: string
  counterpartyAccountNumber: string
  counterpartyName: string
  direction: 'in' | 'out'
}

export type ParserResult = {
  canParse: boolean
  payments: RawBankPayment[]
}

export type BankParser = (content: string) => Promise<ParserResult>

export interface BankStatementParser {
  canParse: (content: string) => boolean
  parse: (content: string) => RawBankPayment[]
} 