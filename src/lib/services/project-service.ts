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

export const getProjects = async () => {
  await new Promise(r => setTimeout(r, 500)) // Simulate network delay
  return mockProjects
}

export const getProject = async (id: string) => {
  await new Promise(r => setTimeout(r, 500))
  return mockProjects.find(p => p.id === id)
}

export const getProjectPledges = async (projectId: string) => {
  await new Promise(r => setTimeout(r, 500))
  return mockPledges.filter(p => p.projectId === projectId)
}

export const createProject = async (data: Omit<Project, "id" | "createdAt" | "updatedAt">) => {
  const project: Project = {
    id: `proj_${Date.now()}`,
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