import { BankPayment, BankStatement } from "@/types"
import { BankPaymentCrud, BankStatementCrud } from "../crud/bank-crud"
import { runTransaction } from "firebase/firestore"

export type CreateBankStatementInput = Omit<BankStatement, 'id' | 'createdAt' | 'updatedAt'>

export type UpdateBankStatementInput = Omit<BankStatement, 'id' | 'createdAt' | 'updatedAt'>

export type CreateBankPaymentInput = Omit<BankPayment, 'id' | 'createdAt' | 'updatedAt'>

export type UpdateBankPaymentInput = Partial<Omit<BankPayment, 'id' | 'createdAt' | 'updatedAt'>>

export class BankWorkflow {
  constructor(
    private bankStatementCrud: BankStatementCrud = new BankStatementCrud(),
    private bankPaymentCrud: BankPaymentCrud = new BankPaymentCrud()
  ) {}

  async createStatement(data: CreateBankStatementInput): Promise<BankStatement> {
    return this.bankStatementCrud.create({
      ...data,
      status: 'pending'
    })
  }

  async createPayment(data: CreateBankPaymentInput): Promise<BankPayment> {
    return this.bankPaymentCrud.create({
      ...data
    })
  }

  async updateStatement(id: string, data: UpdateBankStatementInput): Promise<BankStatement> {
    return this.bankStatementCrud.update(id, data)
  }

  async updatePayment(id: string, data: UpdateBankPaymentInput): Promise<BankPayment> {
    return this.bankPaymentCrud.update(id, data)
  }

  async getStatementById(id: string): Promise<BankStatement | null> {
    return this.bankStatementCrud.getById(id)
  }

  async getPaymentById(id: string): Promise<BankPayment | null> {
    return this.bankPaymentCrud.getById(id)
  }

  async getPaymentsByMonth(month: string): Promise<BankPayment[]> {
    return this.bankPaymentCrud.getByMonth(month)
  }

  async processStatement(id: string): Promise<BankStatement> {
    const statement = await this.bankStatementCrud.getById(id)
    if (!statement) {
      throw new Error(`Statement ${id} not found`)
    }

    return this.bankStatementCrud.update(id, {
      processedAt: new Date().toISOString(),
      status: 'processed'
    })
  }

}
