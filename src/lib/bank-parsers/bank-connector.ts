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

function constructFioApiUrl(apiToken: string, fromDate: Date, toDate: Date): string {
  return `https://fioapi.fio.cz/v1/rest/periods/${apiToken}/${fromDate.toISOString().split('T')[0]}/${toDate.toISOString().split('T')[0]}/transactions.json`
}

export async function downloadFioStatementFromDate(fromDate: Date): Promise<BankConnectorResult> {
  const apiToken = APP_CONFIG.fio?.apiToken
  if (!apiToken) {
    return {
      success: false,
      message: "FIO API token not configured",
    }
  }
  // download statement from FIO API until given date 
  
  // Format date for FIO API (YYYY-MM-DD)
    
  // Current date as the end date
  const toDate = new Date()
  

  // Construct the FIO API URL
  const apiUrl = constructFioApiUrl(apiToken, fromDate, toDate);
  console.log("Apiurl:  ", apiUrl)


  // Fetch statement from FIO API
  const response = await fetch(apiUrl)
  
  if (!response.ok) {
    throw new Error(`FIO API responded with status ${response.status}: ${response.statusText}`)
  }

  return {
    success: true,
    message: 'Succes',
    data: await response.text()
  }
}

/**
 * Connects to FIO Bank API and downloads latest statement
 * @TODO: remove this function and use downloadFioStatementFromDate instead
 */
export async function downloadFioStatement(apiToken: string): Promise<BankConnectorResult> {
  try {
    // Get the API token from environment
    const API_TOKEN = apiToken || APP_CONFIG.fio?.apiToken
    
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
    // this is usually called from firebase functions. Don't forget to recompile the functions after changing this url.
    const apiUrl = constructFioApiUrl(API_TOKEN, fromDate, toDate)

    console.log(`Sending FIO request to url: ${apiUrl}`)
    // Fetch statement from FIO API
    const response = await fetch(apiUrl)
    if(response.status != 200) {
      return {
        success: false,
        message: "FIO API responded with status ${response.status}: ${response.statusText}",
      }
    } 
    
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
