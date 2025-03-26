/**
 * Functions for managing credits and bank statements
 */

import { BankStatement, BankPayment } from "@/types"
import { generateId } from "@/lib/utils"
import { parseStatement } from './bank-parsers'
import { getPaymentsForMonth, updatePayment, getUserPledges, getMonthsWithPayments } from "@/lib/services/payment-service"

/**
 * Process a bank statement and create payment records
 * All payments are initially assigned to their received month
 */
export async function processBankStatement(statement: BankStatement): Promise<BankPayment[]> {
  try {
    // Parse raw payment data using appropriate parser
    const rawPayments = await parseStatement(statement.rawData)
    
    // Create payment records with received month as target
    const payments = await Promise.all(
      rawPayments.map(raw => ({
        id: generateId(),
        statementId: statement.id,
        userId: raw.userId,
        amount: raw.amount,
        receivedAt: raw.receivedAt,
        message: raw.description,
        variableSymbol: raw.variableSymbol,
        specificSymbol: raw.specificSymbol,
        constantSymbol: raw.constantSymbol,
        bankTransactionId: raw.bankTransactionId,
        counterpartyAccountNumber: raw.counterpartyAccountNumber,
        counterpartyName: raw.counterpartyName,
        comment: "",
        targetMonth: new Date(raw.receivedAt).toISOString().slice(0, 7),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }))
    )

    // Mark statement as processed
    /*
    await updateStatement(statement.id, { 
      status: 'processed',
      processedAt: new Date().toISOString()
    })
*/
    return payments
  } catch (error) {
    // Mark statement as error
    /*
    await updateStatement(statement.id, {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    })*/
    throw error
  }
}

/**
 * Split a payment into multiple payments for different months
 * Allows retroactive payment distribution
 */
export async function splitPayment(
  payment: BankPayment,
  splits: Array<{
    amount: number
    targetMonth: string
  }>
): Promise<BankPayment[]> {
  // Validate total split amount equals original payment
  const totalSplit = splits.reduce((sum, split) => sum + split.amount, 0)
  if (totalSplit > payment.amount) {
    throw new Error("Split amounts cannot exceed original payment amount")
  }

  // Create split payments
  const splitPayments = splits.map(split => ({
    id: generateId(),
    statementId: payment.statementId,
    userId: payment.userId,
    amount: split.amount,
    receivedAt: payment.receivedAt,
    message: `Split from payment ${payment.id}`,
    variableSymbol: payment.variableSymbol,
    specificSymbol: payment.specificSymbol,
    constantSymbol: payment.constantSymbol,
    bankTransactionId: payment.bankTransactionId,
    counterpartyAccountNumber: payment.counterpartyAccountNumber,
    counterpartyName: payment.counterpartyName,
    comment: `Virtual payment split from ${payment.id}`,
    targetMonth: split.targetMonth,
    isSplitFromId: payment.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }))

  // Update original payment amount (remaining unsplit amount)
  const remainingAmount = payment.amount - totalSplit
  if (remainingAmount > 0) {
    await updatePayment(payment.id, {
      amount: remainingAmount
    })
  }

  return splitPayments
}

/**
 * Calculate credits awarded for a specific month
 * Includes both original and split payments targeting this month
 */
export async function calculateMonthlyCredits(month: string) {
  // Get all payments targeting this month
  const payments = await getPaymentsForMonth(month)
  
  // Get unique contributors (from both original and split payments)
  const contributors = new Set(payments.map(p => p.userId))

  // Calculate total amount from all payments targeting this month
  const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0)

  // Distribute credits equally among contributors
  const creditsPerContributor = totalAmount / contributors.size

  return {
    month,
    totalAmount,
    contributorCount: contributors.size,
    creditsPerContributor,
    contributors: Array.from(contributors)
  }
}

/**
 * Calculate current balance for a user
 * Based on their contributions across all months and pledges
 */
export async function calculateUserBalance(userId: string): Promise<number> {
  // Get all months with payments
  const months = await getMonthsWithPayments()
  
  // Calculate credits awarded from each month's contributions
  const creditsByMonth = await Promise.all(
    months.map(async month => {
      const monthlyCredits = await calculateMonthlyCredits(month)
      return monthlyCredits.contributors.includes(userId) 
        ? monthlyCredits.creditsPerContributor 
        : 0
    })
  )

  // Sum up all credits
  const totalCredits = creditsByMonth.reduce((sum, credits) => sum + credits, 0)

  // Subtract pledges
  const pledges = await getUserPledges(userId)
  const totalPledged = pledges.reduce((sum, pledge) => sum + pledge.amount, 0)

  return totalCredits - totalPledged
} 