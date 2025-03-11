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

  async calculateBalance(userId: string): Promise<number> {
    // sum credit awards
    const creditAwards = await this.creditAwardCrud.getByUserId(userId)
    const creditAwardAmount = creditAwards.reduce((sum, award) => sum + award.amount, 0)

    // sum pledges
    const pledges = await this.pledgeCrud.getByUserId(userId)
    const pledgeAmount = pledges.reduce((sum, pledge) => sum + pledge.amount, 0)

    return creditAwardAmount - pledgeAmount
  }

  async getActiveUsers(): Promise<User[]> {
    return this.query([{ field: "isActive", operator: "==", value: true }])
  }
}
