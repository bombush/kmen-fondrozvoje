import { DatabaseAdapter } from "../database/database-adapter"
import { DatabaseEntity } from "../database/database-adapter"
import { QueryConstraint } from "../database/database-adapter"

export abstract class BaseCrud<T extends DatabaseEntity> {
  constructor(protected db: DatabaseAdapter<T>) {}

  async create(data: Omit<T, "id" | "createdAt" | "updatedAt">): Promise<T> {
    return this.db.create(data)
  }

  async update(id: string, data: Partial<Omit<T, "id" | "createdAt" | "updatedAt">>): Promise<T> {
    return this.db.update(id, data)
  }

  async getById(id: string): Promise<T | null> {
    return this.db.getById(id)
  }

  protected async query(constraints: QueryConstraint[]): Promise<T[]> {
    return this.db.query(constraints)
  }

  async runTransaction<R>(updateFunction: (transaction: any) => Promise<R>): Promise<R> {
    return this.db.runTransaction(updateFunction)
  }
}
