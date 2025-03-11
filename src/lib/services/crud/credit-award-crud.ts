import { CreditAward } from "@/types"
import { QueryConstraint } from "../database/database-adapter"
import { FirebaseAdapter } from "../database/firebase-adapter"
import { BaseCrud } from "./base-crud"
import { Transaction } from "firebase/firestore"

const COLLECTION_NAME = "creditAwards"

export class CreditAwardCrud extends BaseCrud<CreditAward> {
  constructor() {
    super(new FirebaseAdapter<CreditAward>(COLLECTION_NAME))
  }

  async create(
    data: Omit<CreditAward, "id" | "createdAt" | "updatedAt" | "deleted">,
    transaction?: Transaction
  ): Promise<CreditAward> {
    return super.create({
      ...data,
      deleted: false
    })
  }

  async update(
    id: string, 
    data: Partial<CreditAward>, 
    transaction?: Transaction
  ): Promise<CreditAward> {
    return super.update(id, data)
  }

  async softDelete(id: string): Promise<CreditAward> {
    return this.update(id, { deleted: true })
  }

  async getById(id: string, transaction?: Transaction): Promise<CreditAward | null> {
    return super.getById(id)
  }

  /**
   * Get all credit awards for a specific user
   */
  async getByUserId(userId: string): Promise<CreditAward[]> {
    return this.query([
      { field: "userId", operator: "==", value: userId },
      { field: "deleted", operator: "==", value: false }
    ])
  }

  /**
   * Get all credit awards for a specific month
   */
  async getByMonth(month: string): Promise<CreditAward[]> {
    return this.query([
      { field: "targetMonth", operator: "==", value: month },
      { field: "deleted", operator: "==", value: false }
    ])
  }

  /**
   * Get all credit awards by reason
   */
  async getByReason(reason: CreditAward['reason']): Promise<CreditAward[]> {
    return this.query([
      { field: "reason", operator: "==", value: reason },
      { field: "deleted", operator: "==", value: false }
    ])
  }

  /**
   * Get credit awards for a specific source (e.g., project, payment)
   */
  async getBySource(sourceType: string, sourceId: string): Promise<CreditAward[]> {
    return this.query([
      { field: "sourceType", operator: "==", value: sourceType },
      { field: "sourceId", operator: "==", value: sourceId },
      { field: "deleted", operator: "==", value: false }
    ])
  }

  /**
   * Calculate total credits awarded to a user
   */
  async getTotalCreditsByUser(userId: string): Promise<number> {
    const awards = await this.getByUserId(userId)
    return awards.reduce((total, award) => total + award.amount, 0)
  }

  /**
   * Calculate total credits awarded in a specific month
   */
  async getTotalCreditsByMonth(month: string): Promise<number> {
    const awards = await this.getByMonth(month)
    return awards.reduce((total, award) => total + award.amount, 0)
  }
} 