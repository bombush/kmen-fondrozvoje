import { BankStatement, BankPayment } from "@/types"
import { addDoc, collection, doc, getDoc, getDocs, query, where } from "firebase/firestore"
import { db } from "../firebase/config"

// Service interface
export interface BankService {
  getStatements(): Promise<BankStatement[]>
  getStatement(id: string): Promise<BankStatement | null>
  getPaymentsForStatement(statementId: string): Promise<BankPayment[]>
  createVirtualPayments(
    parentId: string, 
    splits: Array<{ amount: number; targetMonth: string }>
  ): Promise<BankPayment[]>
}

// Firestore implementation
export class FirestoreBankService implements BankService {
  private statementsRef = collection(db, "bank_statements")
  private paymentsRef = collection(db, "bank_payments")

  async getStatements(): Promise<BankStatement[]> {
    try {
      const querySnapshot = await getDocs(this.statementsRef)
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as BankStatement[]
    } catch (error) {
      console.error("Error fetching statements:", error)
      throw error
    }
  }

  async getStatement(id: string): Promise<BankStatement | null> {
    try {
      const docRef = doc(this.statementsRef, id)
      const docSnap = await getDoc(docRef)
      
      if (!docSnap.exists()) {
        return null
      }

      return { id: docSnap.id, ...docSnap.data() } as BankStatement
    } catch (error) {
      console.error("Error fetching statement:", error)
      throw error
    }
  }

  async getPaymentsForStatement(statementId: string): Promise<BankPayment[]> {
    try {
      const q = query(
        this.paymentsRef,
        where("statementId", "==", statementId)
      )
      
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as BankPayment[]
    } catch (error) {
      console.error("Error fetching payments:", error)
      throw error
    }
  }

  async createVirtualPayments(
    parentId: string,
    splits: Array<{ amount: number; targetMonth: string }>
  ): Promise<BankPayment[]> {
    try {
      // Get parent payment
      const parentRef = doc(this.paymentsRef, parentId)
      const parentSnap = await getDoc(parentRef)
      
      if (!parentSnap.exists()) {
        throw new Error("Parent payment not found")
      }

      const parent = { id: parentSnap.id, ...parentSnap.data() } as BankPayment

      // Create virtual payments
      const virtualPayments = await Promise.all(splits.map(async (split) => {
        const virtualPayment: Omit<BankPayment, "id"> = {
          statementId: parent.statementId,
          userId: parent.userId,
          amount: split.amount,
          receivedAt: parent.receivedAt,
          message: `Split from payment ${parentId}`,
          variableSymbol: parent.variableSymbol,
          specificSymbol: parent.specificSymbol,
          constantSymbol: parent.constantSymbol,
          bankTransactionId: parent.bankTransactionId,
          counterpartyAccountNumber: parent.counterpartyAccountNumber,
          counterpartyName: parent.counterpartyName,
          comment: `Virtual payment split from ${parentId}`,
          targetMonth: split.targetMonth
        }

        const docRef = await addDoc(this.paymentsRef, virtualPayment)
        return { id: docRef.id, ...virtualPayment }
      }))

      return virtualPayments
    } catch (error) {
      console.error("Error creating virtual payments:", error)
      throw error
    }
  }
}

// Service factory
let bankService: BankService

export function getBankService(): BankService {
  if (!bankService) {
    bankService = new FirestoreBankService()
  }
  return bankService
}