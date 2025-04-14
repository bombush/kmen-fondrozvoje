import { BankParser, RawBankPayment } from './types'
import { parseAmount, parseDate, cleanDescription } from './index'

const isCsobFormat = async (content: string): Promise<boolean> =>
  content.includes('CSOB Export')

// Synchronous field parsing
const parseCsobRow = (row: string): RawBankPayment => {
  const [date, userId, amount, note] = row.split(',')
  return {
    userId,
    amount: parseAmount(amount),
    receivedAt: parseDate(date),
    description: note,
    variableSymbol: "",
    specificSymbol: "",
    constantSymbol: "",
    bankTransactionId: "",
    counterpartyAccountNumber: "",
    counterpartyBankCode: "",
    counterpartyName: "",
    direction: "in",
    message: ""
  }
}

export const csobParser: BankParser = async (content: string) => {
  if (!await isCsobFormat(content)) {
    return { canParse: false, payments: [], timestampOfStatement: 0 }
  }

  // Process rows in parallel, but field parsing is synchronous
  const rows = content.split('\n').filter(Boolean)
  const payments = await Promise.all(rows.map(async (row) => parseCsobRow(row)))

  return {
    canParse: true,
    payments,
    timestampOfStatement: 0
  }
} 