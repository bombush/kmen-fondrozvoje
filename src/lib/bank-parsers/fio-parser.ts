import { BankParser, RawBankPayment } from './types'
import { parseAmount, parseDate, cleanDescription } from './index'

const isFioFormat = async (content: string): Promise<boolean> => 
  content.includes('FIO Banka')

// Synchronous field parsing
const parseFioRow = (row: string): RawBankPayment => {
  const [date, amount, description, userId] = row.split(';')
  return {
    userId,
    amount: parseAmount(amount),
    receivedAt: parseDate(date),
    description: cleanDescription(description)
  }
}

export const fioParser: BankParser = async (content: string) => {
  if (!await isFioFormat(content)) {
    return { canParse: false, payments: [] }
  }

  // Process rows in parallel, but field parsing is synchronous
  const rows = content.split('\n').filter(Boolean)
  const payments = await Promise.all(rows.map(async (row) => parseFioRow(row)))

  return {
    canParse: true,
    payments
  }
} 