import { RawBankPayment, BankParser } from './types'
import { fioParser } from './fio-parser'
import { csobParser } from './csob-parser'

const parsers: BankParser[] = [
  fioParser,
  csobParser
]

export const parseStatement = async (content: string): Promise<RawBankPayment[]> => {
  // Try parsers sequentially until one succeeds
  for (const parser of parsers) {
    const result = await parser(content)
    if (result.canParse) {
      return result.payments
    }
  }

  throw new Error('No parser found for this bank statement format')
}

// Synchronous utility functions for field parsing
export const parseAmount = (amount: string): number => 
  Number(amount.replace(/[^0-9.-]+/g, ''))

export const parseDate = (date: string): string => 
  new Date(date).toISOString()

export const cleanDescription = (desc: string): string =>
  desc.trim().replace(/\s+/g, ' ') 