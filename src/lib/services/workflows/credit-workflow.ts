import { BankPayment, CreditAward, Pledge, Project, User } from "@/types"
import { CreditAwardCrud } from "../crud/credit-award-crud"
import { UserCrud } from "../crud/user-crud"
import { db } from "../../firebase/config"
import { runTransaction } from "firebase/firestore"
import { BankPaymentCrud } from "../crud/bank-crud"

export class CreditWorkflow {
  private creditAwardCrud: CreditAwardCrud
  private userCrud: UserCrud
  private bankPaymentCrud: BankPaymentCrud

  constructor() {
    this.creditAwardCrud = new CreditAwardCrud()
    this.userCrud = new UserCrud()
    this.bankPaymentCrud = new BankPaymentCrud()
  }

  /**
   * Award credits to a user
   */
  async awardCredits({
    userId,
    amount,
    reason,
    targetMonth,
    notes,
    sourceType,
    sourceId
  }: {
    userId: string;
    amount: number;
    reason: CreditAward['reason'];
    targetMonth?: string;
    notes?: string;
    sourceType?: string;
    sourceId?: string;
  }): Promise<CreditAward> {
    // Validate amount is a valid number
    if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
      throw new Error('Invalid amount. Must be a positive number.');
    }

    // Create credit award
    return this.creditAwardCrud.create({
      userId,
      amount, // Ensure this is a valid number
      reason,
      targetMonth,
      notes,
      sourceType: sourceType || 'admin',
      sourceId: sourceId || 'manual_award'
    })
  }

  /**
   * Award monthly credits to all active users
   * This operations is atomic - either all users get credits or none
   */
  async awardMonthlyCreditToUsers(
    month: string,
    creditAmount: number,
    notes?: string
  ): Promise<CreditAward[]> {
// @TODO: recalculate credit allocation based on payments for the month and update if awards already exist

    try {
      return await runTransaction(db, async (transaction) => {
        // Get all active users
        const users = await this.userCrud.getActiveUsers()
        
        const awards: CreditAward[] = []
        
        // Award credits to each user
        for (const user of users) {
          const award = await this.creditAwardCrud.create({
            userId: user.id,
            amount: creditAmount,
            reason: 'monthly_allocation',
            targetMonth: month,
            notes: notes || `Monthly credit allocation for ${month}`
          }, transaction)
          
          awards.push(award)
        }
        
        return awards
      })
    } catch (error) {
      console.error("Error in awardMonthlyCreditToUsers workflow:", error)
      throw error
    }
  }

  async updateCreditAllocationBasedOnPayments(month: string) {
    // Get all payments for the month
    const payments = await this.bankPaymentCrud.getPaymentsByMonth(month)

    // Get all existing automatic credit awards for the month
    const automaticAwards = await this.creditAwardCrud.getAutomaticAwardsByMonth(month)

    // create a map of total amount received for each user
    const totalAmountReceivedByUser = payments.reduce((acc: Record<string, number>, payment: BankPayment) => {
      acc[payment.userId] = acc[payment.userId] || 0
      acc[payment.userId] += payment.amount
      return acc
    }, {})

    // sum all payments for the month
    const totalAmountReceived = payments.reduce((acc: number, payment: BankPayment) => acc + payment.amount, 0)

    // create a list of users with non-zero amount received
    const usersWithNonZeroAmountReceived = Object.keys(totalAmountReceivedByUser).filter((userId: string) => totalAmountReceivedByUser[userId] > 0)

    const creditsPerUser = totalAmountReceived / usersWithNonZeroAmountReceived.length

    await runTransaction(db, async (transaction) => {
        // update or create new credit awards for the month
        const updatedAwards = automaticAwards.map(async (award) => {
          return await this.creditAwardCrud.update(
          award.id, 
          {
            amount: creditsPerUser
          },
          transaction
        )
      })

      // create new awards if not already in the list
      const newAwards = usersWithNonZeroAmountReceived.filter(userId => !automaticAwards.some(award => award.userId === userId))

      const newlyCreatedAwards = newAwards.map(async (userId) => {
        return await this.creditAwardCrud.create({
          userId,
          amount: creditsPerUser,
          reason: 'monthly_allocation',
          targetMonth: month
        }, transaction)
      })

        return updatedAwards.concat(newlyCreatedAwards)
    })

    return 
  }

  /**
   * Calculate a user's current balance based on their credit awards
   */
  async calculateUserBalance(userId: string): Promise<number> {
    // Get all credit awards for the user
    const awards = await this.creditAwardCrud.getByUserId(userId)
    
    // Sum up the awards
    return awards.reduce((total, award) => total + award.amount, 0)
  }
} 