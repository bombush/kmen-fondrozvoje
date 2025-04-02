import { BankPayment, BankStatement, Pledge, Project, User, CreditAward, HistoryAction } from "@/types"

export interface QueryConstraint {
  field: string
  operator: "==" | "!=" | "<" | "<=" | ">" | ">=" | "array-contains" | "in" | "not-in"
  value: any
}

export type DatabaseEntity = User | Project | Pledge | BankStatement | BankPayment | CreditAward | HistoryAction

export interface DatabaseAdapter<T extends DatabaseEntity> {
  create(data: Omit<T, "id" | "createdAt" | "updatedAt">, transaction?: any): Promise<T>
  update(id: string, data: Partial<Omit<T, "id" | "createdAt" | "updatedAt">>, transaction?: any): Promise<T>
  getById(id: string, transaction?: any): Promise<T | null>
  query(constraints: QueryConstraint[]): Promise<T[]>
  runTransaction<R>(updateFunction: (transaction: any) => Promise<R>): Promise<R>
}
