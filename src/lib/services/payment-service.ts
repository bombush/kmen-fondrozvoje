import { BankPayment, Pledge } from "@/types"
import { collection, doc, getDocs, query, updateDoc, where } from "firebase/firestore"
import { db } from "../firebase/config"

const COLLECTION_NAME = "bank_payments"
const paymentsRef = collection(db, COLLECTION_NAME)

// Mock data - in real app, this would be your database
const payments: BankPayment[] = []
const pledges: any[] = []

// Service functions
export const getPaymentsForMonth = async (month: string): Promise<BankPayment[]> => {
  try {
    const q = query(
      paymentsRef,
      where("targetMonth", "==", month)
    )
    
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as BankPayment[]
  } catch (error) {
    console.error("Error fetching payments for month:", error)
    throw error
  }
}

export const updatePayment = async (id: string, data: Partial<BankPayment>): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id)
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error("Error updating payment:", error)
    throw error
  }
}

export const getUserPledges = async (userId: string) => {
  try {
    const pledgesRef = collection(db, "pledges")
    const q = query(
      pledgesRef,
      where("userId", "==", userId),
      where("deleted", "==", false)
    )
    
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Pledge[]
  } catch (error) {
    console.error("Error fetching user pledges:", error)
    throw error
  }
}

export const getMonthsWithPayments = async (): Promise<string[]> => {
  try {
    const querySnapshot = await getDocs(paymentsRef)
    const months = querySnapshot.docs
      .map(doc => doc.data().targetMonth)
      .filter(month => month) // Filter out undefined/null values
    
    return [...new Set(months)] // Remove duplicates
  } catch (error) {
    console.error("Error fetching months with payments:", error)
    throw error
  }
}