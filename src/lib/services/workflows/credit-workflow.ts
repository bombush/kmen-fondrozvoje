import { CreditAward, Pledge, Project, User } from "@/types"
import { CreditAwardCrud } from "../crud/credit-award-crud"
import { UserCrud } from "../crud/user-crud"
import { db } from "../../firebase/config"
import { runTransaction } from "firebase/firestore"

export class CreditWorkflow {
  private creditAwardCrud: CreditAwardCrud
  private userCrud: UserCrud

  constructor() {
    this.creditAwardCrud = new CreditAwardCrud()
    this.userCrud = new UserCrud()
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

  /**
   * Calculate a user's current balance based on their credit awards
   */
  async calculateUserBalance(userId: string): Promise<number> {
    // Get all credit awards for the user
    const awards = await this.creditAwardCrud.getByUserId(userId)
    
    // Sum up the awards
    return awards.reduce((total, award) => total + award.amount, 0)
  }

  /**
   * Refund credits from a locked pledge back to a user
   */
  async refundPledgeCredits(
    pledgeId: string,
    userId: string,
    amount: number,
    projectId: string
  ): Promise<CreditAward> {
    try {
      return await this.awardCredits({
        userId,
        amount,
        reason: 'refund',
        sourceId: pledgeId,
        sourceType: 'pledge',
        notes: `Refund from project ${projectId}`
      })
    } catch (error) {
      console.error("Error in refundPledgeCredits workflow:", error)
      throw error
    }
  }
} 