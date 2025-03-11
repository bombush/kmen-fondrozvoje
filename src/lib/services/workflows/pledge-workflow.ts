import { Pledge } from "@/types"
import { Transaction } from "firebase/firestore"
import { PledgeCrud } from "../crud/pledge-crud"
import { UserCrud } from "../crud/user-crud"

export class PledgeWorkflow {
  private pledgeCrud: PledgeCrud
  private userCrud: UserCrud

  constructor() {
    this.pledgeCrud = new PledgeCrud()
    this.userCrud = new UserCrud()
  }

  /**
   * Creates a new pledge to a project and updates the user's balance
   * This operation is atomic - either both the pledge is created and balance updated, or neither
   */
  async pledgeToProject(
    userId: string,
    projectId: string,
    amount: number,
    description: string
  ): Promise<Pledge> {
    try {
      return await this.pledgeCrud.runTransaction(async (transaction: Transaction) => {
        // Update user's balance
        await this.userCrud.updateBalance(userId, -amount, transaction)

        // Create pledge
        const pledge = await this.pledgeCrud.create({
          userId,
          projectId,
          amount,
          description,
          status: "pending"
        }, transaction)

        return pledge
      })
    } catch (error) {
      console.error("Error in pledgeToProject workflow:", error)
      throw error
    }
  }

  /**
   * Cancels a pledge and restores the user's balance
   * This operation is atomic - either both operations succeed or neither
   */
  async cancelPledge(pledgeId: string): Promise<Pledge> {
    try {
      return await this.pledgeCrud.runTransaction(async (transaction: Transaction) => {
        // Get pledge
        const pledge = await this.pledgeCrud.getById(pledgeId, transaction)
        if (!pledge) {
          throw new Error(`Pledge ${pledgeId} not found`)
        }

        if (pledge.locked) {
          throw new Error("Cannot cancel a locked pledge")
        }

        // Restore user's balance
        await this.userCrud.updateBalance(pledge.userId, pledge.amount, transaction)

        // Mark pledge as deleted
        return this.pledgeCrud.softDelete(pledgeId, transaction)
      })
    } catch (error) {
      console.error("Error in cancelPledge workflow:", error)
      throw error
    }
  }

  /**
   * Updates a pledge amount and adjusts the user's balance accordingly
   * This operation is atomic - either both operations succeed or neither
   */
  async updatePledgeAmount(
    pledgeId: string,
    newAmount: number
  ): Promise<Pledge> {
    try {
      return await this.pledgeCrud.runTransaction(async (transaction: Transaction) => {
        // Get pledge
        const pledge = await this.pledgeCrud.getById(pledgeId, transaction)
        if (!pledge) {
          throw new Error(`Pledge ${pledgeId} not found`)
        }

        if (pledge.locked) {
          throw new Error("Cannot update a locked pledge")
        }

        // Calculate balance adjustment
        const balanceAdjustment = pledge.amount - newAmount

        // Update user's balance
        await this.userCrud.updateBalance(pledge.userId, balanceAdjustment, transaction)

        // Update pledge amount
        return this.pledgeCrud.update(pledgeId, { amount: newAmount }, transaction)
      })
    } catch (error) {
      console.error("Error in updatePledgeAmount workflow:", error)
      throw error
    }
  }

  /**
   * Locks a pledge
   */
  async lockPledge(pledgeId: string): Promise<Pledge> {
    try {
      return await this.pledgeCrud.update(pledgeId, { locked: true })
    } catch (error) {
      console.error("Error in lockPledge workflow:", error)
      throw error
    }
  }

  /**
   * Unlocks a pledge
   */
  async unlockPledge(pledgeId: string): Promise<Pledge> {
    try {
      return await this.pledgeCrud.update(pledgeId, { locked: false })
    } catch (error) {
      console.error("Error in unlockPledge workflow:", error)
      throw error
    }
  }
}
