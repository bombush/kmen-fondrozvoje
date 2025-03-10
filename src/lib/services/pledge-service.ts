import { toast } from "sonner"
import { Pledge } from "@/types"

const MOCK_DELAY = process.env.NODE_ENV === 'development' ? 500 : 0

export const createPledge = async (data: Omit<Pledge, "id" | "createdAt" | "updatedAt" | "locked" | "deleted">) => {
  await new Promise(r => setTimeout(r, MOCK_DELAY))
  
  const pledge: Pledge = {
    id: `pld_${Date.now()}`,
    locked: false,
    deleted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...data
  }

  try {
    // In a real implementation, this would be a DB call
    // For now using mock success
    toast.success("Pledge created successfully")
    return pledge
  } catch (error) {
    toast.error("Failed to create pledge")
    throw error
  }
}

export const updatePledge = async (id: string, data: Partial<Pledge>) => {
  await new Promise(r => setTimeout(r, MOCK_DELAY))

  try {
    const updatedPledge: Pledge = {
      ...data,
      id,
      updatedAt: new Date().toISOString()
    } as Pledge

    toast.success("Pledge updated successfully")
    return updatedPledge
  } catch (error) {
    toast.error("Failed to update pledge")
    throw error
  }
}

export const deletePledge = async (id: string) => {
  await new Promise(r => setTimeout(r, MOCK_DELAY))

  try {
    const deletedPledge: Pledge = {
      id,
      deleted: true,
      updatedAt: new Date().toISOString()
    } as Pledge

    toast.success("Pledge deleted successfully")
    return deletedPledge
  } catch (error) {
    toast.error("Failed to delete pledge")
    throw error
  }
}

export const getPledge = async (id: string): Promise<Pledge | null> => {
  await new Promise(r => setTimeout(r, MOCK_DELAY))
  
  try {
    // Mock implementation
    return {
      id,
      userId: "user_1",
      projectId: "proj_1",
      amount: 1000,
      locked: false,
      deleted: false,
      description: "Sample pledge",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  } catch (error) {
    console.error("Error fetching pledge:", error)
    return null
  }
}

export const getUserPledges = async (userId: string): Promise<Pledge[]> => {
  await new Promise(r => setTimeout(r, MOCK_DELAY))
  
  try {
    // Mock implementation
    return [{
      id: "pld_1",
      userId,
      projectId: "proj_1",
      amount: 1000,
      locked: false,
      deleted: false,
      description: "Sample pledge",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }]
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
