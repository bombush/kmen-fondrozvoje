import { DatabaseAdapter } from "../database/database-adapter"
import { DatabaseEntity } from "../database/database-adapter"
import { QueryConstraint } from "../database/database-adapter"
import { Transaction } from "firebase/firestore"

export abstract class BaseCrud<T extends DatabaseEntity> {
  constructor(protected db: DatabaseAdapter<T>) {}

  async create(data: Omit<T, "id" | "createdAt" | "updatedAt">, transaction?: Transaction): Promise<T> {
    return this.db.create(data, transaction)
  }

  async update(id: string, data: Partial<Omit<T, "id" | "createdAt" | "updatedAt">>, transaction?: Transaction): Promise<T> {
    return this.db.update(id, data, transaction)
  }

  async getById(id: string, transaction?: Transaction): Promise<T | null> {
    return this.db.getById(id, transaction)
  }

  protected async query(constraints: QueryConstraint[]): Promise<T[]> {
    return this.db.query(constraints)
  }

  async runTransaction<R>(updateFunction: (transaction: Transaction) => Promise<R>): Promise<R> {
    return this.db.runTransaction(updateFunction)
  }
}
