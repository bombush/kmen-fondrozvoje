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
    // Create a safe copy without reserved fields
    const safeData = { ...data } as any; // Use type assertion 
    
    // Now we can safely delete these properties if they exist
    if (safeData.id) delete safeData.id;
    if (safeData.createdAt) delete safeData.createdAt;
    if (safeData.updatedAt) delete safeData.updatedAt;
    
    return this.db.update(id, safeData, transaction);
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
