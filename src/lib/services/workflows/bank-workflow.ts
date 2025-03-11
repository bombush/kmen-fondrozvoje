import { BankPayment, BankStatement, CreateBankPaymentInput, CreateBankStatementInput, UpdateBankPaymentInput, UpdateBankStatementInput } from "@/types"
import { BankPaymentCrud, BankStatementCrud } from "../crud/bank-crud"
import { runTransaction } from "firebase/firestore"

export class BankWorkflow {
  constructor(
    private bankStatementCrud: BankStatementCrud = new BankStatementCrud(),
    private bankPaymentCrud: BankPaymentCrud = new BankPaymentCrud()
  ) {}

  async createStatement(data: CreateBankStatementInput): Promise<BankStatement> {
    return this.bankStatementCrud.create({
      ...data,
      processedAmount: 0,
      status: 'pending'
    })
  }

  async createPayment(data: CreateBankPaymentInput): Promise<BankPayment> {
    return this.bankPaymentCrud.create({
      ...data,
      status: 'pending'
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

  async processPayment(id: string): Promise<BankPayment> {
    const payment = await this.bankPaymentCrud.getById(id)
    if (!payment) {
      throw new Error(`Payment ${id} not found`)
    }

    return this.bankPaymentCrud.update(id, {
      processedAt: new Date().toISOString(),
      status: 'processed'
    })
  }
}
