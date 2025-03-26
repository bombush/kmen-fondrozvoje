/**
 * FIO Bank Parser
 * 
 * Based on reference implementation from Google Apps Script.
 * Parses FIO bank statement JSON format and returns structured payment data.
 */

import { BankParser, BankStatementParser, ParserResult, RawBankPayment } from "./types"
import { UserCrud } from "../services/crud/user-crud"

interface FioTransaction {
  column22: {
    value: number  // Amount
  }
  column0: {
    value: string  // Date in YYYY-MM-DD format
  }
  column1: {
    value: string  // Counter account number
  }
  column10: {
    value: string  // Specific symbol
  }
  column5: {
    value: string  // Variable symbol
  }
  column4: {
    value: string  // Constant symbol
  }
  column14: {
    value: string  // Message for recipient
  }
  column17: {
    value: string  // Counter account name
  }
  column8: {
    value: string  // Transaction ID
  }
  column9: {
    value: string  // Comment
  }
}

interface FioResponse {
  accountStatement: {
    info: {
      accountId: string
      bankId: string
      currency: string
      iban: string
      bic: string
      openingBalance: number
      closingBalance: number
      dateStart: string
      dateEnd: string
      yearList: null
      idList: null
      idFrom: number
      idTo: number
      idLastDownload: null
    }
    transactionList: {
      transaction: FioTransaction[]
    }
  }
}

export class FioParser implements BankStatementParser {
  private userCrud = new UserCrud()
  
  /**
   * Checks if the provided content is a valid FIO bank statement
   */
  canParse(content: string): boolean {
    try {
      const data = JSON.parse(content)
      return (
        data.accountStatement && 
        data.accountStatement.info && 
        data.accountStatement.transactionList &&
        Array.isArray(data.accountStatement.transactionList.transaction)
      )
    } catch (error) {
      return false
    }
  }

  /**
   * Parses FIO bank statement JSON and returns structured payment data
   */
  async parse(content: string): Promise<RawBankPayment[]> {
    if (!this.canParse(content)) {
      throw new Error("Invalid FIO bank statement format")
    }

    const data = JSON.parse(content) as FioResponse
    const transactions = data.accountStatement.transactionList.transaction
    
    // Get all users to match specific symbols
    const users = await this.userCrud.getAll()
    const usersBySpecificSymbol = new Map()
    
    users.forEach(user => {
      if (user.specificSymbol) {
        usersBySpecificSymbol.set(user.specificSymbol, user.id)
      }
    })
    
    // Process transactions and match to users
    const payments: RawBankPayment[] = []
    
    for (const transaction of transactions) {
      // Only process incoming payments (amount > 0)
      if (transaction.column22.value <= 0) continue
      
      const specificSymbol = transaction.column10.value
      const userId = usersBySpecificSymbol.get(specificSymbol)
      
      // Skip transactions we can't match to a user
      if (!userId) continue
      
      payments.push({
        userId,
        amount: transaction.column22.value,
        receivedAt: transaction.column0.value,
        description: transaction.column14.value || transaction.column9.value || '',
        variableSymbol: transaction.column5.value || '',
        specificSymbol: specificSymbol || '',
        constantSymbol: transaction.column4.value || '',
        bankTransactionId: transaction.column8.value,
        counterpartyAccountNumber: transaction.column1.value || '',
        counterpartyName: transaction.column17.value || ''
      })
    }
    
    return payments
  }
}

/**
 * Function-style parser implementation compatible with BankParser interface
 */
export const fioParser: BankParser = async (content: string): Promise<ParserResult> => {
  const parser = new FioParser()
  
  if (!parser.canParse(content)) {
    return {
      canParse: false,
      payments: []
    }
  }
  
  try {
    const payments = await parser.parse(content)
    return {
      canParse: true,
      payments
    }
  } catch (error) {
    console.error("Error parsing FIO statement:", error)
    return {
      canParse: true,
      payments: []
    }
  }
} 