export type RawBankPayment = {
  userId: string
  amount: number
  receivedAt: string
  description: string   
  variableSymbol: string
  specificSymbol: string
  constantSymbol: string
  bankTransactionId: string
  counterpartyAccountNumber: string,
  counterpartyBankCode: string,
  counterpartyName: string
  direction: 'in' | 'out'
  message: string
}

export type ParserResult = {
  canParse: boolean
  payments: RawBankPayment[]
  timestampOfStatement: number
}

export type BankParser = (content: string) => Promise<ParserResult>

export interface BankStatementParser {
  canParse: (content: string) => Promise<boolean>
  parse: (content: string) => Promise<ParserResult>
} 