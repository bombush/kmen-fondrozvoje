import { BankPayment, BankStatement } from "@/types"
import { FirebaseAdapter } from "../database/firebase-adapter"
import { QueryConstraint } from "@/lib/services/database/database-adapter"
import { BaseCrud } from "./base-crud"
import { query, Transaction } from "firebase/firestore"
import { PaymentsQueryConfig } from "@/hooks/use-payments"

export class BankStatementCrud extends BaseCrud<BankStatement> {
  constructor() {
    super(new FirebaseAdapter<BankStatement>("bankStatements"))
  }

  async getById(id: string): Promise<BankStatement | null> {
    return super.getById(id)
  }

  async create(data: Omit<BankStatement, "id" | "createdAt" | "updatedAt">): Promise<BankStatement> {
    return super.create(data)
  }

  async update(id: string, data: Partial<BankStatement>): Promise<BankStatement> {
    return super.update(id, data)
  }

  async getByMonth(month: string): Promise<BankStatement[]> {
    return this.query([{
      field: "month",
      operator: "==",
      value: month
    }])
  }
}

export class BankPaymentCrud extends BaseCrud<BankPayment> {
  constructor() {
    super(new FirebaseAdapter<BankPayment>("bankPayments"))
  }

  async getById(id: string): Promise<BankPayment | null> {
    return super.getById(id)
  }

  async create(data: Omit<BankPayment, "id" | "createdAt" | "updatedAt">): Promise<BankPayment> {
    return super.create({
      ...data,
      deleted: false
    })
  }

  async update(id: string, data: Partial<BankPayment>): Promise<BankPayment> {
    return super.update(id, data)
  }

  async softDelete(id: string): Promise<BankPayment> {
    return this.update(id, { deleted: true })
  }

  async getByStatementId(statementId: string): Promise<BankPayment[]> {
    return this.query([
      {
        field: "statementId",
        operator: "==",
        value: statementId
      },
      {
        field: "deleted",
        operator: "==",
        value: false
      }
    ])
  }

  async getByMonth(month: string): Promise<BankPayment[]> {
    return this.query([
      {
        field: "targetMonth",
        operator: "==",
        value: month
      },
      {
        field: "deleted",
        operator: "==",
        value: false
      }
    ])
  }

  async getByUserId(userId: string): Promise<BankPayment[]> {
    return this.query([
      {
        field: "userId",
        operator: "==",
        value: userId
      },
      {
        field: "deleted",
        operator: "==",
        value: false
      }
    ])
  }

  async getFiltered(params: BankPaymentsFilterParams, includeDeleted = false) {
    // Create an empty array of query constraints
    const queryConstraints: QueryConstraint[] = []
    
    Object.keys(params).forEach(key => {
      if (params[key as keyof BankPaymentsFilterParams] !== null) {
        queryConstraints.push({
          field: key, 
          operator: "==",
          value: params[key as keyof BankPaymentsFilterParams]
        })
      }
    })
    
    if(!includeDeleted) {
      queryConstraints.push({
        field: "deleted",
        operator: "==",
        value: false
      })
    }
    
    return this.query(queryConstraints)
  }
}
// define a type PaymentQueryParams which is a subset of Bank Payment where the explicitly mentioned fields are omited and the rest of fields are optional
export type BankPaymentsFilterParams = Partial<Omit<BankPayment, "id" | "createdAt" | "updatedAt" | "deleted">>;

