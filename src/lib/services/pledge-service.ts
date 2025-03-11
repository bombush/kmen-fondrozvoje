import { Pledge } from "@/types"
import { addDoc, collection, doc, getDoc, getDocs, query, updateDoc, where } from "firebase/firestore"
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
    return { id: docRef.id, ...pledge } as Pledge
  } catch (error) {
    console.error("Error creating pledge:", error)
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
    return { id, ...updatedData } as Pledge
  } catch (error) {
    console.error("Error updating pledge:", error)
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

    return { id, deleted: true } as Pledge
  } catch (error) {
    console.error("Error deleting pledge:", error)
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
    throw error
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
    throw error
  }
}

export const lockPledge = async (id: string): Promise<Pledge> => {
  await new Promise(r => setTimeout(r, MOCK_DELAY))
  
  try {
    const updatedPledge = await updatePledge(id, { locked: true })
    return updatedPledge
  } catch (error) {
    console.error("Error locking pledge:", error)
    throw error
  }
}

export const unlockPledge = async (id: string): Promise<Pledge> => {
  await new Promise(r => setTimeout(r, MOCK_DELAY))
  
  try {
    const updatedPledge = await updatePledge(id, { locked: false })
    return updatedPledge
  } catch (error) {
    console.error("Error unlocking pledge:", error)
    throw error
  }
}
