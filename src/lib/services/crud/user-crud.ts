import { User } from "@/types"
import { FirebaseAdapter } from "../database/firebase-adapter"
import { BaseCrud } from "./base-crud"
import { Transaction } from "firebase/firestore"

const COLLECTION_NAME = "users"

export class UserCrud extends BaseCrud<User> {
  constructor() {
    super(new FirebaseAdapter<User>(COLLECTION_NAME))
  }

  async getById(id: string, transaction?: Transaction): Promise<User | null> {
    return super.getById(id, transaction)
  }

  async create(data: Partial<User>, transaction?: Transaction): Promise<User> {
    return super.create(data, transaction)
  }

  async update(
    id: string,
    data: Partial<User>,
    transaction?: Transaction
  ): Promise<User> {
    return super.update(id, data, transaction)
  }

  async getByEmail(email: string): Promise<User | null> {
    const users = await this.query([{ field: "email", operator: "==", value: email }])
    return users[0] || null
  }

  async updateBalance(userId: string, amount: number, transaction?: Transaction): Promise<User> {
    const user = await this.getById(userId, transaction)
    if (!user) {
      throw new Error(`User ${userId} not found`)
    }

    const newBalance = user.balance + amount
    return this.update(userId, { balance: newBalance }, transaction)
  }
}
