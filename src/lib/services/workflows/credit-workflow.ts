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
  async awardCredits(
    userId: string,
    amount: number,
    reason: CreditAward['reason'],
    options: {
      sourceId?: string,
      sourceType?: string,
      notes?: string,
      targetMonth?: string
    } = {}
  ): Promise<CreditAward> {
    try {
      // Create the credit award record
      const creditAward = await this.creditAwardCrud.create({
        userId,
        amount,
        reason,
        ...options
      })

      return creditAward
    } catch (error) {
      console.error("Error in awardCredits workflow:", error)
      throw error
    }
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
      return await this.awardCredits(userId, amount, 'refund', {
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