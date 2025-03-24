import { Project } from "@/types"
import { addDoc, collection, doc, getDoc, getDocs, query, updateDoc, where } from "firebase/firestore"
import { db } from "../firebase/config"

const COLLECTION_NAME = "projects"
const projectsRef = collection(db, COLLECTION_NAME)

export const getProjects = async (includeDeleted = false) => {
  try {
    const q = includeDeleted 
      ? query(projectsRef)
      : query(projectsRef, where("deleted", "==", false))
    
    const querySnapshot = await getDocs(q)
    console.log('querySnapshot', querySnapshot)
    console.log('querySnapshot docs', querySnapshot.docs)
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Project[]
  } catch (error) {
    console.error("Error fetching projects:", error)
    throw error
  }
}

export const getProject = async (id: string): Promise<Project | null> => {
  if(!id) {
    return null
  }
  
  try {
    console.trace()
    console.log('id', id)
    const docRef = doc(db, COLLECTION_NAME, id)
    console.log('docRef', docRef) 
    const docSnap = await getDoc(docRef)
    
    if (!docSnap.exists()) {
      return null
    }

    return { id: docSnap.id, ...docSnap.data() } as Project
  } catch (error) {
    console.error("Error fetching project:", error)
    throw error
  }
}

export const getProjectPledges = async (projectId: string) => {
  try {
    const pledgesRef = collection(db, "pledges")
    const q = query(
      pledgesRef,
      where("projectId", "==", projectId),
      where("deleted", "==", false)
    )
    
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  } catch (error) {
    console.error("Error fetching project pledges:", error)
    throw error
  }
}

export const createProject = async (data: Omit<Project, "id" | "createdAt" | "updatedAt" | "deleted">) => {
  try {
    const project: Omit<Project, "id"> = {
      deleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data
    }

    const docRef = await addDoc(projectsRef, project)
    return { id: docRef.id, ...project } as Project
  } catch (error) {
    console.error("Error creating project:", error)
    throw error
  }
}

export const updateProject = async (id: string, data: Partial<Project>) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id)
    // remove undefined fields from the data
    const updatedData = Object.fromEntries(
      Object.entries(data).filter(([_, value]) => value !== undefined)
    )
    updatedData.updatedAt = new Date().toISOString()

    await updateDoc(docRef, updatedData)
    return { id, ...updatedData } as Project
  } catch (error) {
    console.error("Error updating project:", error)
    throw error
  }
}

// @TODO: rename to softDeleteProject
export const deleteProject = async (id: string) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id)
    const updatedData = {
      deleted: true,
      updatedAt: new Date().toISOString()
    }

    await updateDoc(docRef, updatedData)
    return { id, ...updatedData } as Project
  } catch (error) {
    console.error("Error deleting project:", error)
    throw error
  }
}

export const undoDeleteProject = async (id: string) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id)
    const updatedData = {
      deleted: false,
      updatedAt: new Date().toISOString()
    }

    await updateDoc(docRef, updatedData)
    return { id, ...updatedData } as Project
  } catch (error) {
    console.error("Error restoring project:", error)
    throw error
  }
}