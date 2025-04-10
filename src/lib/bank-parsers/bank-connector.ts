/**
 * Bank Connector
 * 
 * Provides functionality to connect to a bank API, download statements,
 * parse them, and store the results in the database.
 */

import { APP_CONFIG } from "@/config"
import { BankStatement } from "@/types"
import { FirebaseAdapter } from "../services/database/firebase-adapter"
import { fioParser } from "./fio-parser"
import { runTransaction } from "firebase/firestore"
import { db } from "../firebase/config"
import { BankStatementCrud } from "../services/crud/bank-crud"
import { BankWorkflow } from "../services/workflows/bank-workflow"

const DEFAULT_FIRST_DATE = APP_CONFIG.bankConfig.defaultFirstDateToFetch

interface BankConnectorResult {
  success: boolean
  message: string
  data?: string
  error?: any
}

/**
 * Connects to FIO Bank API and downloads latest statement
 */
export async function downloadFioStatement(): Promise<BankConnectorResult> {
  try {
    // Get the API token from environment
    const API_TOKEN = APP_CONFIG.fio?.apiToken
    
    if (!API_TOKEN) {
      return {
        success: false,
        message: "FIO API token not configured",
      }
    }
    
    // Get the last statement to determine the date range
    const statementCrud = new BankStatementCrud()
    const statements = await statementCrud.getLatest()
    if(statements.length == 0) {
      // use default date from config if exists or throw error if no date could be determined.
    }
    
    // Sort statements by timestamp (descending)
    const sortedStatements = statements
      .filter(s => s.adapter === 'fio' && !s.deleted)
      .sort((a, b) => b.timestampOfStatement - a.timestampOfStatement)
    
    // Determine start date for fetching
    let fromDate: Date
    
    if (sortedStatements.length > 0) {
      // Get date from the most recent statement
      fromDate = new Date(sortedStatements[0].timestampOfStatement)
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
    const out: BankConnectorResult =  {
      success: true,
      message: 'Succes',
      data: statement
    }

    return out
        
  } catch (error) {
    console.error("Error downloading FIO statement:", error)
    return {
      success: false,
      message: `Failed to download or process FIO statement: ${error}`,
      error
    }
  }
}
