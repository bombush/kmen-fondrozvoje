/**
 * Bank Connector
 * 
 * Provides functionality to connect to a bank API, download statements,
 * parse them, and store the results in the database.
 */

import { BANK_CONFIG } from "@/config"
import { BankStatement } from "@/types"
import { FirebaseAdapter } from "../services/database/firebase-adapter"
import { fioParser } from "./fio-parser"
import { runTransaction } from "firebase/firestore"
import { db } from "../firebase/config"
import { BankStatementCrud } from "../services/crud/bank-crud"
import { BankWorkflow } from "../services/workflows/bank-workflow"

const DEFAULT_FIRST_DATE = BANK_CONFIG.defaultFirstDateToFetch || new Date(2022, 9, 1) // Oct 1, 2022

interface BankConnectorResult {
  success: boolean
  message: string
  statementId?: string
  paymentCount?: number
  error?: any
}

/**
 * Connects to FIO Bank API and downloads latest statement
 */
export async function downloadFioStatement(): Promise<BankConnectorResult> {
  try {
    // Get the API token from environment
    const API_TOKEN = BANK_CONFIG.fio?.apiToken
    
    if (!API_TOKEN) {
      return {
        success: false,
        message: "FIO API token not configured"
      }
    }
    
    // Get the last statement to determine the date range
    const statementCrud = new BankStatementCrud()
    const statements = await statementCrud.getAll()
    
    // Sort statements by timestamp (descending)
    const sortedStatements = statements
      .filter(s => s.adapter === 'fio' && !s.deleted)
      .sort((a, b) => b.timestamp - a.timestamp)
    
    // Determine start date for fetching
    let fromDate: Date
    
    if (sortedStatements.length > 0) {
      // Get date from the most recent statement
      fromDate = new Date(sortedStatements[0].timestamp)
      // Add one day to avoid getting same transactions
      fromDate.setDate(fromDate.getDate() + 1)
    } else {
      // Use default first date if no statements exist
      fromDate = DEFAULT_FIRST_DATE
    }
    
    // Format date for FIO API (YYYY-MM-DD)
    const formattedFromDate = fromDate.toISOString().split('T')[0]
    
    // Current date as the end date
    const toDate = new Date()
    const formattedToDate = toDate.toISOString().split('T')[0]
    
    // Construct the FIO API URL
    const apiUrl = `https://www.fio.cz/ib_api/rest/periods/${API_TOKEN}/${formattedFromDate}/${formattedToDate}/transactions.json`
    
    // Fetch statement from FIO API
    const response = await fetch(apiUrl)
    
    if (!response.ok) {
      throw new Error(`FIO API responded with status ${response.status}: ${response.statusText}`)
    }
    
    const statement = await response.text()

    return statement
    
    // Parse the statement with the FIO parser
    const parseResult = await fioParser(statement)
    
    if (!parseResult.canParse) {
      return {
        success: false,
        message: "Failed to parse FIO statement"
      }
    }
    
    if (parseResult.payments.length === 0) {
      return {
        success: true,
        message: "No new transactions found",
        paymentCount: 0
      }
    }
    
    // Store the statement and payments in a transaction
    const workflow = new BankWorkflow()
    const result = await workflow.processStatement({
      adapter: 'fio',
      month: toDate.toISOString().substring(0, 7), // YYYY-MM format
      rawData: statement,
      timestamp: toDate.getTime(),
      payments: parseResult.payments
    })
    
    return {
      success: true,
      message: `Successfully downloaded and processed ${parseResult.payments.length} transactions`,
      statementId: result.id,
      paymentCount: parseResult.payments.length
    }
    
  } catch (error) {
    console.error("Error downloading FIO statement:", error)
    return {
      success: false,
      message: "Failed to download or process FIO statement",
      error
    }
  }
}

/**
 * Downloads a bank statement based on the configured bank adapter
 * @returns Result of the download operation
 */
export async function downloadBankStatement(): Promise<BankConnectorResult> {
  const supportedBanks = BANK_CONFIG.supportedBanks || ['FIO']
  
  // Currently only supporting FIO bank
  if (supportedBanks.includes('FIO')) {
    return downloadFioStatement()
  }
  
  return {
    success: false,
    message: "No supported bank adapters configured"
  }
}
