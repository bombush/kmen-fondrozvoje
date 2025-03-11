import { User } from "@/types"
import { UserCrud } from "../crud/user-crud"
import { CreditAwardCrud } from "../crud/credit-award-crud"
import { PledgeCrud } from "../crud/pledge-crud"
import { CreditWorkflow } from "./credit-workflow"
import { db } from "../../firebase/config"
import { runTransaction } from "firebase/firestore"

export type CreateUserInput = Omit<User, "id" | "createdAt" | "updatedAt" | "isActive"> & {
  isActive?: boolean
}

export type UpdateUserInput = Partial<Omit<User, "id" | "createdAt" | "updatedAt">>

export class UserWorkflow {
  private userCrud: UserCrud
  private creditAwardCrud: CreditAwardCrud
  private pledgeCrud: PledgeCrud
  private creditWorkflow: CreditWorkflow

  constructor() {
    this.userCrud = new UserCrud()
    this.creditAwardCrud = new CreditAwardCrud()
    this.pledgeCrud = new PledgeCrud()
    this.creditWorkflow = new CreditWorkflow()
  }

  /**
   * Create a new user
   */
  async createUser(userData: CreateUserInput): Promise<User> {
    try {
      const user = await this.userCrud.create({
        ...userData,
        isActive: userData.isActive ?? true
      })
      
      return user
    } catch (error) {
      console.error("Error in createUser workflow:", error)
      throw error
    }
  }


  /**
   * Activate a user
   */
  async activateUser(userId: string): Promise<User> {
    try {
      const user = await this.userCrud.getById(userId)
      if (!user) {
        throw new Error(`User ${userId} not found`)
      }

      return await this.userCrud.update(userId, { isActive: true })
    } catch (error) {
      console.error("Error in activateUser workflow:", error)
      throw error
    }
  }

  /**
   * Deactivate a user
   */
  async deactivateUser(userId: string): Promise<User> {
    try {
      const user = await this.userCrud.getById(userId)
      if (!user) {
        throw new Error(`User ${userId} not found`)
      }

      return await this.userCrud.update(userId, { isActive: false })
    } catch (error) {
      console.error("Error in deactivateUser workflow:", error)
      throw error
    }
  }

  /**
   * Delete a user (for admin purposes only)
   * This will soft-delete the user and all their pledges
   */
  async deleteUser(userId: string): Promise<void> {
    try {
      return await runTransaction(db, async (transaction) => {
        // Get user
        const user = await this.userCrud.getById(userId)
        if (!user) {
          throw new Error(`User ${userId} not found`)
        }

        // Get all user's pledges
        const pledges = await this.pledgeCrud.getByUserId(userId)
        
        // Soft delete each pledge
        for (const pledge of pledges) {
          await this.pledgeCrud.softDelete(pledge.id, transaction)
        }
        
        // Soft delete user
        const deletedUser = await this.userCrud.softDelete(userId)

        return deletedUser
      })
    } catch (error) {
      console.error("Error in deleteUser workflow:", error)
      throw error
    }
  }
} 