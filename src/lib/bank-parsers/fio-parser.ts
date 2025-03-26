/**
 * FIO Bank Parser
 * 
 * Based on reference implementation from Google Apps Script.
 * Parses FIO bank statement JSON format and returns structured payment data.
 */

import { BankParser, BankStatementParser, ParserResult, RawBankPayment } from "./types"
import { UserCrud } from "../services/crud/user-crud"
import { BANK_CONFIG } from "@/config"

// Complete type definitions for FIO bank statement format based on reference file
interface FioColumnData {
  value: any  // The actual value
  name: string  // Display name of the field
  id: number  // Field ID
}

interface FioTransaction {
  // Transaction identification
  column22?: FioColumnData  // ID pohybu
  column17?: FioColumnData  // ID pokynu
  
  // Transaction details
  column0?: FioColumnData   // Date (timestamp)
  column1?: FioColumnData   // Amount
  column14?: FioColumnData  // Currency
  
  // Counter party details
  column2?: FioColumnData   // Counter account number
  column10?: FioColumnData  // Counter account name
  column3?: FioColumnData   // Bank code
  column12?: FioColumnData  // Bank name
  
  // Payment symbols
  column4?: FioColumnData   // Constant symbol (KS)
  column5?: FioColumnData   // Variable symbol (VS)
  column6?: FioColumnData   // Specific symbol (SS)
  
  // Additional information
  column7?: FioColumnData   // User identification
  column8?: FioColumnData   // Transaction type
  column9?: FioColumnData   // Performed by
  column16?: FioColumnData  // Optional field
  column18?: FioColumnData  // Optional field
  column25?: FioColumnData  // Comment
  column26?: FioColumnData  // Optional field
}

interface FioTransactionList {
  transaction: FioTransaction[]
}

interface FioAccountInfo {
  accountId: string
  bankId: string
  currency: string
  iban: string
  bic: string
  openingBalance: number
  closingBalance: number
  dateStart: number   // Unix timestamp
  dateEnd: number     // Unix timestamp
  yearList: any       // Can be null
  idList: any         // Can be null
  idFrom: number
  idTo: number
  idLastDownload: number
}

interface FioAccountStatement {
  info: FioAccountInfo
  transactionList: FioTransactionList
}

interface FioResponse {
  accountStatement: FioAccountStatement
}

/**
 * FIO Bank statement parser
 */
export class FioParser implements BankStatementParser {
  private userCrud: UserCrud
  
  constructor() {
    this.userCrud = new UserCrud()
  }
  
  /**
   * Check if the provided content is a FIO bank statement
   */
  canParse(content: string): boolean {
    try {
      // Parse JSON content
      const data = JSON.parse(content)
      
      // Check for FIO bank statement structure
      return (
        data &&
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
  parse(content: string): RawBankPayment[] {
    if (!this.canParse(content)) {
      throw new Error("Invalid FIO bank statement format")
    }
    
    // Parse the JSON content
    const data: FioResponse = JSON.parse(content)
    const transactions = data.accountStatement.transactionList.transaction
    
    // Get all users to match specific symbols
    const payments: RawBankPayment[] = []
    
    // Process each transaction
    for (const transaction of transactions) {
      // Skip transactions with negative or zero amounts (outgoing payments)
      const amount = transaction.column1?.value
      if (!amount || amount <= 0) continue
      
      // Extract the specific symbol if present
      const specificSymbol = transaction.column6?.value || ""
      
      // Map the transaction to a RawBankPayment
      payments.push({
        userId: "", // Will be filled in later by matching with specificSymbol
        amount: amount,
        receivedAt: new Date(transaction.column0?.value).toISOString(),
        description: this.extractDescription(transaction),
        variableSymbol: transaction.column5?.value || "",
        specificSymbol: specificSymbol,
        constantSymbol: transaction.column4?.value || "",
        bankTransactionId: transaction.column22?.value?.toString() || "",
        counterpartyAccountNumber: transaction.column2?.value || "",
        counterpartyName: transaction.column10?.value || ""
      })
    }
    
    return payments
  }
  
  /**
   * Extracts a description from the transaction data, combining multiple possible fields
   */
  private extractDescription(transaction: FioTransaction): string {
    // Try multiple fields as potential sources for description
    const sources = [
      transaction.column25?.value, // Comment field
      transaction.column7?.value,  // User identification
      transaction.column8?.value,  // Transaction type
      transaction.column9?.value   // Performed by
    ]
    
    // Concatenate all non-empty fields
    return sources
      .filter(value => value && typeof value === 'string' && value.trim() !== '')
      .join(' - ')
      .trim()
  }
  
  /**
   * Match users with their specific symbols
   * This function updates the userId field in the payment objects
   */
  async matchUsersToPayments(payments: RawBankPayment[]): Promise<RawBankPayment[]> {
    // Get all users with their specific symbols
    const users = await this.userCrud.getAll()
    const usersBySymbol = new Map()
    
    // Create a map of specific symbols to user IDs
    for (const user of users) {
      if (user.specificSymbol) {
        usersBySymbol.set(user.specificSymbol, user.id)
      }
    }
    
    // Match payments to users based on specific symbol
    for (const payment of payments) {
      if (payment.specificSymbol && usersBySymbol.has(payment.specificSymbol)) {
        payment.userId = usersBySymbol.get(payment.specificSymbol)
      }
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
    // Parse the raw payments
    const payments = parser.parse(content)
    
    // Match users to payments based on specific symbols
    const matchedPayments = await parser.matchUsersToPayments(payments)
    
    return {
      canParse: true,
      payments: matchedPayments
    }
  } catch (error) {
    console.error("Error parsing FIO statement:", error)
    return {
      canParse: true,
      payments: []
    }
  }
} 