import { BankPayment, BankStatement, HistoryAction } from "@/types"
import { BankPaymentCrud, BankStatementCrud } from "../crud/bank-crud"
import { db } from "@/lib/firebase/config"
import { runTransaction } from "firebase/firestore"
import { HistoryCrud } from "../crud/history-crud"

export type CreateBankStatementInput = Omit<BankStatement, 'id' | 'createdAt' | 'updatedAt'>

export type UpdateBankStatementInput = Omit<BankStatement, 'id' | 'createdAt' | 'updatedAt'>

export type CreateBankPaymentInput = Omit<BankPayment, 'id' | 'createdAt' | 'updatedAt'>

export type UpdateBankPaymentInput = Partial<Omit<BankPayment, 'id' | 'createdAt' | 'updatedAt'>>

export interface SplitPaymentItem {
  id: string
  amount: number
  targetMonth: string
}

export class BankWorkflow {
  constructor(
    private bankStatementCrud: BankStatementCrud = new BankStatementCrud(),
    private bankPaymentCrud: BankPaymentCrud = new BankPaymentCrud(),
    private historyCrud: HistoryCrud = new HistoryCrud()
  ) {}

  async createStatement(data: CreateBankStatementInput): Promise<BankStatement> {
    return this.bankStatementCrud.create({
      ...data,
      status: 'pending'
    })
  }

  async createPayment(data: CreateBankPaymentInput): Promise<BankPayment> {
    return this.bankPaymentCrud.create({
      ...data
    })
  }

  async updateStatement(id: string, data: UpdateBankStatementInput): Promise<BankStatement> {
    return this.bankStatementCrud.update(id, data)
  }

  async updatePayment(id: string, data: UpdateBankPaymentInput): Promise<BankPayment> {
    return this.bankPaymentCrud.update(id, data)
  }

  async getStatementById(id: string): Promise<BankStatement | null> {
    return this.bankStatementCrud.getById(id)
  }

  async getPaymentById(id: string): Promise<BankPayment | null> {
    return this.bankPaymentCrud.getById(id)
  }

  async getPaymentsByMonth(month: string): Promise<BankPayment[]> {
    return this.bankPaymentCrud.getByMonth(month)
  }

  async processStatement(id: string): Promise<BankStatement> {
    const statement = await this.bankStatementCrud.getById(id)
    if (!statement) {
      throw new Error(`Statement ${id} not found`)
    }

    return this.bankStatementCrud.update(id, {
      processedAt: new Date().toISOString(),
      status: 'processed'
    })
  }

  /**
   * Split a payment into multiple payments with different target months
   * This operation is wrapped in a transaction for data consistency
   * 
   * @param originalPaymentId The ID of the payment to split
   * @param splits An array of split items with amount and target month
   * @param userId The ID of the user performing the split
   * @returns The updated original payment and the newly created splits
   */
  async splitPayment(
    originalPaymentId: string, 
    splits: SplitPaymentItem[],
    userId: string
  ): Promise<{
    originalPayment: BankPayment,
    childPayments: BankPayment[]
  }> {
    // Validate that we have at least one split
    if (!splits.length) {
      throw new Error("At least one split is required")
    }
    
    // Fetch the original payment
    const originalPayment = await this.bankPaymentCrud.getById(originalPaymentId)
    if (!originalPayment) {
      throw new Error(`Payment ${originalPaymentId} not found`)
    }
    
    // Calculate total split amount
    const totalSplitAmount = splits.reduce((sum, split) => sum + split.amount, 0)
    
    // Validate the total split amount doesn't exceed the original payment amount
    if (totalSplitAmount > originalPayment.amount) {
      throw new Error(`Total split amount (${totalSplitAmount}) exceeds original payment amount (${originalPayment.amount})`)
    }
    
    // Run the entire operation as a transaction
    return runTransaction(db, async (transaction) => {
      // Calculate remaining amount for the original payment
      const remainingAmount = originalPayment.amount - totalSplitAmount
      
      // Update the original payment with the remaining amount
      const updatedOriginalPayment = {
        ...originalPayment,
        amount: remainingAmount,
        comment: `${originalPayment.comment || ''}\nSplit ${totalSplitAmount} into ${splits.length} payments`,
        updatedAt: new Date().toISOString()
      }
      
      await this.bankPaymentCrud.update(originalPaymentId, updatedOriginalPayment, transaction)
      
      // Create child payments
      const childPayments: BankPayment[] = []
      
      for (const split of splits) {
        const childPayment: CreateBankPaymentInput = {
          statementId: originalPayment.statementId,
          userId: originalPayment.userId,
          amount: split.amount,
          variableSymbol: originalPayment.variableSymbol,
          specificSymbol: originalPayment.specificSymbol,
          constantSymbol: originalPayment.constantSymbol,
          bankTransactionId: originalPayment.bankTransactionId,
          counterpartyAccountNumber: originalPayment.counterpartyAccountNumber,
          counterpartyName: originalPayment.counterpartyName,
          receivedAt: originalPayment.receivedAt,
          message: originalPayment.message,
          comment: `Split from payment ${originalPaymentId}`,
          isSplitFromId: originalPaymentId,
          targetMonth: split.targetMonth,
          deleted: false
        }
        
        const createdPayment = await this.bankPaymentCrud.create(childPayment, transaction)
        childPayments.push(createdPayment)
      }
      
      // Record this action in history
      await this.historyCrud.create({
        type: 'split_payment',
        entityId: originalPaymentId,
        userId,
        data: {
          before: { id: originalPaymentId, amount: originalPayment.amount },
          after: {
            parent: { id: originalPaymentId, amount: remainingAmount },
            children: childPayments.map(p => ({ 
              id: p.id, 
              amount: p.amount, 
              targetMonth: p.targetMonth 
            }))
          }
        }
      }, transaction)
      
      return {
        originalPayment: updatedOriginalPayment,
        childPayments
      }
    })
  }

  /**
   * Adjust an existing payment and potentially split portions to different months
   * This operation is wrapped in a transaction for data consistency
   * 
   * @param originalPaymentId The ID of the payment to adjust
   * @param originalAdjustment The adjustment to apply to the original payment
   * @param splits An array of split items with amount and target month
   * @param userId The ID of the user performing the operation
   * @returns The updated original payment and any newly created or updated splits
   */
  async adjustPayment(
    originalPaymentId: string,
    originalAdjustment: { amount: number, targetMonth: string },
    splits: SplitPaymentItem[],
    userId: string
  ): Promise<{
    originalPayment: BankPayment,
    childPayments: BankPayment[]
  }> {

    // Fetch the original payment
    const originalPayment = await this.bankPaymentCrud.getById(originalPaymentId)
    if (!originalPayment) {
      throw new Error(`Payment ${originalPaymentId} not found`)
    }

    // throw error if we're trying to adjust a payment that is a child of another payment
    if (originalPayment.isSplitFromId) {
      throw new Error(`Payment ${originalPaymentId} is a child of another payment`)
    }

    // Get existing child payments
    const existingChildPayments = await this.bankPaymentCrud.query([
      {
        field: "isSplitFromId",
        operator: "==",
        value: originalPaymentId
      },
      {
        field: "deleted",
        operator: "==",
        value: false
      }
    ])

    const originalDistributedAmount = originalPayment.amount + existingChildPayments.reduce((sum, payment) => sum + payment.amount, 0);

    // Calculate the total amount that should be allocated
    const totalAllocated = originalAdjustment.amount + 
      splits.reduce((sum, split) => sum + split.amount, 0)

    // Validate the total allocated amount matches the original amount
    if (Math.abs(totalAllocated - originalDistributedAmount) > 0.01) {
      throw new Error(`Total allocated amount (${totalAllocated}) does not match original payment amount (${originalPayment.amount})`)
    }

    // Run the entire operation as a transaction
    return runTransaction(db, async (transaction) => {
      // Update the original payment with the adjusted amount and month
      const updatedOriginalPayment = {
        ...originalPayment,
        amount: originalAdjustment.amount,
        targetMonth: originalAdjustment.targetMonth,
        comment: originalPayment.comment || '',
        updatedAt: new Date().toISOString()
      }

      await this.bankPaymentCrud.update(originalPaymentId, updatedOriginalPayment, transaction)

      // Create or update child payments
      const childPayments: BankPayment[] = []
      
      // Process each split
      for (const split of splits) {
        // Check if this split already exists (by ID)
        const existingChild = existingChildPayments.find(p => p.id === split.id)

        if (existingChild) {
          // Update existing child
          const updatedChild = {
            ...existingChild,
            amount: split.amount,
            targetMonth: split.targetMonth,
            updatedAt: new Date().toISOString()
          }
          await this.bankPaymentCrud.update(existingChild.id, updatedChild, transaction)
          childPayments.push(updatedChild)
        } else {
          // Create new child
          const childPayment: CreateBankPaymentInput = {
            statementId: originalPayment.statementId,
            userId: originalPayment.userId,
            amount: split.amount,
            variableSymbol: originalPayment.variableSymbol,
            specificSymbol: originalPayment.specificSymbol,
            constantSymbol: originalPayment.constantSymbol,
            bankTransactionId: originalPayment.bankTransactionId,
            counterpartyAccountNumber: originalPayment.counterpartyAccountNumber,
            counterpartyName: originalPayment.counterpartyName,
            receivedAt: originalPayment.receivedAt,
            message: originalPayment.message,
            comment: `Split from payment ${originalPaymentId}`,
            isSplitFromId: originalPaymentId,
            targetMonth: split.targetMonth,
            deleted: false
          }
          
          const createdPayment = await this.bankPaymentCrud.create(childPayment, transaction)
          childPayments.push(createdPayment)
        }
      }
      
      // Check for existing child payments that were removed
      for (const existingChild of existingChildPayments) {
        if (!splits.some(split => split.id === existingChild.id)) {
          // This child was removed, so mark it as deleted
          await this.bankPaymentCrud.update(existingChild.id, {
            deleted: true,
            updatedAt: new Date().toISOString()
          }, transaction)
        }
      }
      
      // @todo: record this action in history
      
      return {
        originalPayment: updatedOriginalPayment,
        childPayments
      }
    })
  }
}
