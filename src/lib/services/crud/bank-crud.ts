import { BankPayment, BankStatement } from "@/types"
import { FirebaseAdapter } from "../database/firebase-adapter"
import { BaseCrud } from "./base-crud"
import { Transaction } from "firebase/firestore"

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
}
