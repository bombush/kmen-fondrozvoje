import { CreatePledgeInput, Pledge } from "@/types"
import { QueryConstraint } from "../database/database-adapter"
import { FirebaseAdapter } from "../database/firebase-adapter"
import { BaseCrud } from "./base-crud"
import { Transaction } from "firebase/firestore"

const COLLECTION_NAME = "pledges"

export class PledgeCrud extends BaseCrud<Pledge> {
  constructor() {
    super(new FirebaseAdapter<Pledge>(COLLECTION_NAME))
  }

  async create(
    data: CreatePledgeInput,
    transaction?: Transaction
  ): Promise<Pledge> {
    const pledgeData = {
      ...data,
      locked: false,
      deleted: false
    }
    return super.create(pledgeData, transaction)
  }

  async update(
    id: string, 
    data: Partial<Pledge>, 
    transaction?: Transaction
  ): Promise<Pledge> {
    return super.update(id, data, transaction)
  }

  async softDelete(id: string, transaction?: Transaction): Promise<Pledge> {
    return this.update(id, { deleted: true }, transaction)
  }

  async getById(id: string, transaction?: Transaction): Promise<Pledge | null> {
    return super.getById(id, transaction)
  }

  async getByUserId(userId: string): Promise<Pledge[]> {
    return this.query([{ field: "userId", operator: "==", value: userId }])
  }

  async getByProjectId(projectId: string): Promise<Pledge[]> {
    return this.query([{ field: "projectId", operator: "==", value: projectId }])
  }
}
