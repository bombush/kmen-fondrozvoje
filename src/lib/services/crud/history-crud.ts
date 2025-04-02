import { HistoryAction } from "@/types"
import { FirebaseAdapter } from "../database/firebase-adapter"
import { BaseCrud } from "./base-crud"
import { Transaction } from "firebase/firestore"

export class HistoryCrud extends BaseCrud<HistoryAction> {
  constructor() {
    super(new FirebaseAdapter<HistoryAction>("history"))
  }

  async create(
    data: Omit<HistoryAction, "id" | "createdAt">,
    transaction?: Transaction
  ): Promise<HistoryAction> {
    return this.db.create({
      ...data
    }, transaction)
  }

  async getByEntityId(entityId: string): Promise<HistoryAction[]> {
    return this.query([
      {
        field: "entityId",
        operator: "==",
        value: entityId
      }
    ])
  }

  async getByType(type: string): Promise<HistoryAction[]> {
    return this.query([
      {
        field: "type",
        operator: "==",
        value: type
      }
    ])
  }

  async getByUserId(userId: string): Promise<HistoryAction[]> {
    return this.query([
      {
        field: "userId",
        operator: "==",
        value: userId
      }
    ])
  }
} 