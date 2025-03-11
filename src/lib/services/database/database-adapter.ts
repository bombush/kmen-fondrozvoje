import { BankPayment, BankStatement, Pledge, Project, User, CreditAward } from "@/types"

export interface QueryConstraint {
  field: string
  operator: "==" | "!=" | "<" | "<=" | ">" | ">=" | "array-contains" | "in" | "not-in"
  value: any
}

export type DatabaseEntity = User | Project | Pledge | BankStatement | BankPayment | CreditAward

export interface DatabaseAdapter<T extends DatabaseEntity> {
  create(data: Omit<T, "id" | "createdAt" | "updatedAt">): Promise<T>
  update(id: string, data: Partial<Omit<T, "id" | "createdAt" | "updatedAt">>): Promise<T>
  getById(id: string): Promise<T | null>
  query(constraints: QueryConstraint[]): Promise<T[]>
  runTransaction<R>(updateFunction: (transaction: any) => Promise<R>): Promise<R>
}
