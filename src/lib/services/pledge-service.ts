import { toast } from "sonner"
import { Pledge } from "@/types"
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, query, updateDoc, where } from "firebase/firestore"
import { db } from "../firebase/config"

const COLLECTION_NAME = "pledges"
const pledgesRef = collection(db, COLLECTION_NAME)

const MOCK_DELAY = process.env.NODE_ENV === 'development' ? 500 : 0

export const createPledge = async (data: Omit<Pledge, "id" | "createdAt" | "updatedAt" | "locked" | "deleted">) => {
  await new Promise(r => setTimeout(r, MOCK_DELAY))
  
  try {
    const pledge: Omit<Pledge, "id"> = {
      locked: false,
      deleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data
    }

    const docRef = await addDoc(pledgesRef, pledge)
    
    toast.success("Pledge created successfully")
    return { id: docRef.id, ...pledge } as Pledge
  } catch (error) {
    toast.error("Failed to create pledge")
    throw error
  }
}

export const updatePledge = async (id: string, data: Partial<Pledge>) => {
  await new Promise(r => setTimeout(r, MOCK_DELAY))
  
  try {
    const docRef = doc(db, COLLECTION_NAME, id)
    const updatedData = {
      ...data,
      updatedAt: new Date().toISOString()
    }

    await updateDoc(docRef, updatedData)
    
    toast.success("Pledge updated successfully")
    return { id, ...updatedData } as Pledge
  } catch (error) {
    toast.error("Failed to update pledge")
    throw error
  }
}

export const deletePledge = async (id: string) => {
  await new Promise(r => setTimeout(r, MOCK_DELAY))
  
  try {
    const docRef = doc(db, COLLECTION_NAME, id)
    await updateDoc(docRef, {
      deleted: true,
      updatedAt: new Date().toISOString()
    })

    toast.success("Pledge deleted successfully")
    return { id, deleted: true } as Pledge
  } catch (error) {
    toast.error("Failed to delete pledge")
    throw error
  }
}

export const getPledge = async (id: string): Promise<Pledge | null> => {
  await new Promise(r => setTimeout(r, MOCK_DELAY))
  
  try {
    const docRef = doc(db, COLLECTION_NAME, id)
    const docSnap = await getDoc(docRef)
    
    if (!docSnap.exists()) {
      return null
    }

    return { id: docSnap.id, ...docSnap.data() } as Pledge
  } catch (error) {
    console.error("Error fetching pledge:", error)
    return null
  }
}

export const getUserPledges = async (userId: string): Promise<Pledge[]> => {
  await new Promise(r => setTimeout(r, MOCK_DELAY))
  
  try {
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
    return []
  }
}

export const lockPledge = async (id: string): Promise<Pledge> => {
  await new Promise(r => setTimeout(r, MOCK_DELAY))
  
  try {
    const updatedPledge = await updatePledge(id, { locked: true })
    toast.success("Pledge locked successfully")
    return updatedPledge
  } catch (error) {
    toast.error("Failed to lock pledge")
    throw error
  }
}

export const unlockPledge = async (id: string): Promise<Pledge> => {
  await new Promise(r => setTimeout(r, MOCK_DELAY))
  
  try {
    const updatedPledge = await updatePledge(id, { locked: false })
    toast.success("Pledge unlocked successfully")
    return updatedPledge
  } catch (error) {
    toast.error("Failed to unlock pledge")
    throw error
  }
}
