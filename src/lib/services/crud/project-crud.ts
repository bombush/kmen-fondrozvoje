import { Project } from "@/types"
import { addDoc, collection, doc, getDoc, getDocs, query, updateDoc, where } from "firebase/firestore"
import { db } from "../../firebase/config"

const COLLECTION_NAME = "projects"
const projectsRef = collection(db, COLLECTION_NAME)

export class ProjectCrud {
  async create(data: Omit<Project, "id" | "createdAt" | "updatedAt" | "deleted">) {
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

  async update(id: string, data: Partial<Project>) {
    try {
      const docRef = doc(db, COLLECTION_NAME, id)
      const updatedData = {
        ...data,
        updatedAt: new Date().toISOString()
      }

      await updateDoc(docRef, updatedData)
      return { id, ...updatedData } as Project
    } catch (error) {
      console.error("Error updating project:", error)
      throw error
    }
  }

  async softDelete(id: string) {
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

  async restore(id: string) {
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

  async getById(id: string): Promise<Project | null> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id)
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

  async getAll(includeDeleted = false): Promise<Project[]> {
    try {
      const q = includeDeleted 
        ? query(projectsRef)
        : query(projectsRef, where("deleted", "==", false))
      
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Project[]
    } catch (error) {
      console.error("Error fetching projects:", error)
      throw error
    }
  }

  async getByOwner(ownerId: string, includeDeleted = false): Promise<Project[]> {
    try {
      const q = includeDeleted
        ? query(projectsRef, where("ownerId", "==", ownerId))
        : query(projectsRef, 
            where("ownerId", "==", ownerId),
            where("deleted", "==", false)
          )
      
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Project[]
    } catch (error) {
      console.error("Error fetching owner projects:", error)
      throw error
    }
  }
}
