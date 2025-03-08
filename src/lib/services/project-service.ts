import { Project } from "@/types"

// Mock data
const mockProjects: Project[] = [
  {
    id: "proj_1",
    name: "Community Garden",
    description: "Creating a shared garden space for the community",
    url: "https://example.com/garden",
    goal: 5000,
    ownerId: "user_1",
    completed: false,
    deleted: false,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z"
  },
  {
    id: "proj_2",
    name: "Solar Panels",
    description: "Installing solar panels on the community center",
    goal: 10000,
    ownerId: "user_2",
    completed: true,
    deleted: false,
    createdAt: "2023-12-01T00:00:00Z",
    updatedAt: "2024-01-15T00:00:00Z"
  }
]

// Mock pledges
const mockPledges = [
  {
    id: "pld_1",
    projectId: "proj_1",
    userId: "user_2",
    amount: 1000,
    locked: false,
    createdAt: "2024-01-15T00:00:00Z"
  },
  {
    id: "pld_2", 
    projectId: "proj_2",
    userId: "user_1",
    amount: 5000,
    locked: true,
    createdAt: "2023-12-15T00:00:00Z"
  }
]

const MOCK_DELAY = process.env.NODE_ENV === 'development' ? 500 : 0

export const getProjects = async (includeDeleted = false) => {
  await new Promise(r => setTimeout(r, MOCK_DELAY))
  return includeDeleted ? mockProjects : mockProjects.filter(p => !p.deleted)
}

export const getProject = async (id: string): Promise<Project | null> => {
  console.log('Fetching project:', id)
  await new Promise(r => setTimeout(r, 500))
  const project = mockProjects.find(p => p.id === id)
  console.log('Found project:', project)
  return project || null
}

export const getProjectPledges = async (projectId: string) => {
  await new Promise(r => setTimeout(r, 500))
  return mockPledges.filter(p => p.projectId === projectId)
}

export const createProject = async (data: Omit<Project, "id" | "createdAt" | "updatedAt" | "deleted">) => {
  const project: Project = {
    id: `proj_${Date.now()}`,
    deleted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...data
  }
  mockProjects.push(project)
  return project
}

export const updateProject = async (id: string, data: Partial<Project>) => {
  await new Promise(r => setTimeout(r, 500))
  const index = mockProjects.findIndex(p => p.id === id)
  if (index === -1) throw new Error("Project not found")
  
  mockProjects[index] = {
    ...mockProjects[index],
    ...data,
    updatedAt: new Date().toISOString()
  }
  return mockProjects[index]
}

export const deleteProject = async (id: string) => {
  await new Promise(r => setTimeout(r, 500))
  const index = mockProjects.findIndex(p => p.id === id)
  if (index === -1) throw new Error("Project not found")
  
  // Mark the project as deleted instead of removing it
  mockProjects[index] = {
    ...mockProjects[index],
    deleted: true,
    updatedAt: new Date().toISOString()
  }
  
  return mockProjects[index]
}

export const undoDeleteProject = async (id: string) => {
  await new Promise(r => setTimeout(r, 300))
  
  const index = mockProjects.findIndex(p => p.id === id && p.deleted)
  if (index === -1) throw new Error("Deleted project not found")
  
  // Mark the project as not deleted
  mockProjects[index] = {
    ...mockProjects[index],
    deleted: false,
    updatedAt: new Date().toISOString()
  }
  
  return mockProjects[index]
}