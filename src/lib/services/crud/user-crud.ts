import { User } from "@/types"
import { FirebaseAdapter } from "../database/firebase-adapter"
import { BaseCrud } from "./base-crud"
import { Transaction } from "firebase/firestore"
import { CreditAwardCrud } from "./credit-award-crud"
import { PledgeCrud } from "./pledge-crud"

const COLLECTION_NAME = "users"

export class UserCrud extends BaseCrud<User> {
  private creditAwardCrud: CreditAwardCrud;
  private pledgeCrud: PledgeCrud;

  constructor() {
    super(new FirebaseAdapter<User>(COLLECTION_NAME))
    this.creditAwardCrud = new CreditAwardCrud()
    this.pledgeCrud = new PledgeCrud()
  }

  async getById(id: string, transaction?: Transaction): Promise<User | null> {
    return super.getById(id)
  }

  async create(data: Omit<User, "id" | "createdAt" | "updatedAt">): Promise<User> {
    // the following mus be unique: email, specific symbol, variable symbol and constnt symbol
    const existingUser = await this.getByEmail(data.email)
    if (existingUser) {
      throw new Error("Email already exists")
    }

    if (data.specificSymbol) {
      const existingUserBySpecificSymbol = await this.getBySpecificSymbol(data.specificSymbol)
      if (existingUserBySpecificSymbol) {
        throw new Error("Specific symbol already exists")
      }
    }

    if (data.variableSymbol) {
      const existingUserByVariableSymbol = await this.getByVariableSymbol(data.variableSymbol)
      if (existingUserByVariableSymbol) {
        throw new Error("Variable symbol already exists")
      }
    }
    
    if (data.constantSymbol) {
      const existingUserByConstantSymbol = await this.getByConstantSymbol(data.constantSymbol)
      if (existingUserByConstantSymbol) {
        throw new Error("Constant symbol already exists")
      }
    }

    return super.create(data)
  }

  async update(
    id: string,
    data: Partial<User>,
    transaction?: Transaction
  ): Promise<User> {
    // check if user exists
    const user = await this.getById(id)
    if (!user) {
      throw new Error(`User ${id} not found`)
    }

    if (data.email) {
      const existingUser = await this.getByEmail(data.email)
      if (existingUser && existingUser.id !== id) {
        throw new Error("Email already exists")
      }
    }

    if (data.specificSymbol) {
      const existingUserBySpecificSymbol = await this.getBySpecificSymbol(data.specificSymbol)
      if (existingUserBySpecificSymbol && existingUserBySpecificSymbol.id !== id) {
        throw new Error("Specific symbol already exists")
      }
    } 

    if (data.variableSymbol) {
      const existingUserByVariableSymbol = await this.getByVariableSymbol(data.variableSymbol)
      if (existingUserByVariableSymbol && existingUserByVariableSymbol.id !== id) {
        throw new Error("Variable symbol already exists")
      }
    } 

    if (data.constantSymbol) {
      const existingUserByConstantSymbol = await this.getByConstantSymbol(data.constantSymbol)
      if (existingUserByConstantSymbol && existingUserByConstantSymbol.id !== id) {
        throw new Error("Constant symbol already exists")
      }
    }

    return super.update(id, data)
  }

  async getByEmail(email: string): Promise<User | null> {
    const users = await this.query([{ field: "email", operator: "==", value: email }])
    return users[0] || null
  }

  async getBySpecificSymbol(specificSymbol: string): Promise<User | null> {
    const users = await this.query([{ field: "specificSymbol", operator: "==", value: specificSymbol }])
    return users[0] || null
  }

  async getByVariableSymbol(variableSymbol: string): Promise<User | null> {
    const users = await this.query([{ field: "variableSymbol", operator: "==", value: variableSymbol }])
    return users[0] || null
  }

  async getByConstantSymbol(constantSymbol: string): Promise<User | null> {
    const users = await this.query([{ field: "constantSymbol", operator: "==", value: constantSymbol }])
    return users[0] || null
  }

  async calculateBalance(userId: string): Promise<number> {
    // sum credit awards
    const creditAwards = await this.creditAwardCrud.getByUserId(userId)
    const creditAwardAmount = creditAwards.reduce((sum, award) => sum + award.amount, 0)

    // sum pledges
    const pledges = await this.pledgeCrud.getByUserId(userId)
    const pledgeAmount = pledges.reduce((sum, pledge) => sum + pledge.amount, 0)

    return creditAwardAmount - pledgeAmount
  }

  async getBalance(userId: string): Promise<number> {
    const balance = await this.calculateBalance(userId)
    return balance
  }

  async getActiveUsers(): Promise<User[]> {
    return this.query([{ field: "isActive", operator: "==", value: true }])
  }

  async softDelete(id: string): Promise<void> {
    // check if user exists
    const user = await this.getById(id)
    if (!user) {
      throw new Error(`User ${id} not found`)
    }

    // soft delete user
    await this.update(id, { isActive: false })
  }

  async getAll(): Promise<User[]> {
    return this.query([])
  }
}
