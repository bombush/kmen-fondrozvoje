import { ProjectWorkflow } from '../project-workflow'
import { ProjectCrud } from '../../crud/project-crud'
import { PledgeCrud } from '../../crud/pledge-crud'
import { Project, Pledge } from '@/types'
import { runTransaction } from 'firebase/firestore'

// Mock the CRUD classes
jest.mock('../../crud/project-crud')
jest.mock('../../crud/pledge-crud')

describe('ProjectWorkflow', () => {
  let projectWorkflow: ProjectWorkflow
  let mockProjectCrud: jest.Mocked<ProjectCrud>
  let mockPledgeCrud: jest.Mocked<PledgeCrud>
  
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks()
    
    // Create mock instances
    mockProjectCrud = new ProjectCrud() as jest.Mocked<ProjectCrud>
    mockPledgeCrud = new PledgeCrud() as jest.Mocked<PledgeCrud>
    
    // Create workflow with mocked dependencies
    projectWorkflow = new ProjectWorkflow()
    // @ts-ignore - access private properties for testing
    projectWorkflow.projectCrud = mockProjectCrud
    // @ts-ignore
    projectWorkflow.pledgeCrud = mockPledgeCrud
  })
  
  describe('createProject', () => {
    it('should create a new project', async () => {
      // Arrange
      const projectData = {
        name: 'Test Project',
        description: 'A test project',
        goal: 1000,
        ownerId: 'user1',
        closed: false,
        fundsSentToOwner: false,
        bought: false,
        addedToAssetList: false,
        locked: false
      }
      
      const createdProject = {
        id: 'proj1',
        ...projectData,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        deleted: false,
        fundsSentToOwner: false,
        bought: false,
        addedToAssetList: false,
        locked: false
      }
      
      mockProjectCrud.create.mockResolvedValue(createdProject)
      
      // Act
      const result = await projectWorkflow.createProject(projectData)
      
      // Assert
      expect(mockProjectCrud.create).toHaveBeenCalledWith(projectData)
      expect(result).toEqual(createdProject)
    })
  })
  
  describe('closeProject', () => {
    it('should close a project and lock all pledges', async () => {
      // Arrange
      const projectId = 'proj1'
      const project = {
        id: projectId,
        name: 'Test Project',
        description: 'A test project',
        goal: 1000,
        ownerId: 'user1',
        closed: false,
        deleted: false,
        createdAt: '2023-01-01',
        updatedAt: '2023-01-01',
        fundsSentToOwner: false,
        bought: false,
        addedToAssetList: false,
        locked: false
      }
      
      const pledges: Pledge[] = [
        { 
          id: 'pledge1', 
          projectId, 
          userId: 'user1', 
          amount: 500, 
          locked: false, 
          createdAt: '2023-01-01', 
          updatedAt: '2023-01-01',
          description: 'Test pledge 1'
        },
        { 
          id: 'pledge2', 
          projectId, 
          userId: 'user2', 
          amount: 500, 
          locked: false, 
          createdAt: '2023-01-01', 
          updatedAt: '2023-01-01',
          description: 'Test pledge 2'
        }
      ]
      
      const updatedProject = {
        ...project,
        closed: true,
        closedAt: expect.any(String),
        updatedAt: expect.any(String)
      }
      
      // Setup mocks
      mockProjectCrud.getById.mockResolvedValue(project)
      mockPledgeCrud.getByProjectId.mockResolvedValue(pledges)
      mockPledgeCrud.update.mockImplementation((id) => 
        Promise.resolve({ ...pledges.find(p => p.id === id), locked: true, updatedAt: new Date().toISOString() } as Pledge)
      )
      mockProjectCrud.update.mockResolvedValue(updatedProject)
      
      // Mock canDeleteProject
      jest.spyOn(projectWorkflow, 'canDeleteProject').mockResolvedValue(true)
      
      // Act
      const result = await projectWorkflow.closeProject(projectId)
      
      // Assert
      expect(runTransaction).toHaveBeenCalled()
      expect(mockProjectCrud.getById).toHaveBeenCalledWith(projectId)
      expect(mockPledgeCrud.getByProjectId).toHaveBeenCalledWith(projectId)
      expect(mockPledgeCrud.update).toHaveBeenCalledTimes(pledges.length)
      expect(mockProjectCrud.update).toHaveBeenCalledWith(projectId, {
        closed: true,
        closedAt: expect.any(String)
      })
      expect(result).toEqual(updatedProject)
    })
    
    it('should throw an error if project balance doesn\'t match goal', async () => {
      // Arrange
      const projectId = 'proj1'
      
      // Mock canDeleteProject to return false
      jest.spyOn(projectWorkflow, 'canDeleteProject').mockResolvedValue(false)
      
      // Act & Assert
      await expect(projectWorkflow.closeProject(projectId)).rejects.toThrow(
        'Project cannot be closed because it has an outstanding balance'
      )
    })
  })
  
  describe('getProjectBalance', () => {
    it('should calculate the sum of all pledges for a project', async () => {
      // Arrange
      const projectId = 'proj1'
      const pledges: Pledge[] = [
        { 
          id: 'pledge1', 
          projectId, 
          userId: 'user1', 
          amount: 500, 
          locked: false, 
          createdAt: '2023-01-01', 
          updatedAt: '2023-01-01',
          description: 'Test pledge 1'
        },
        { 
          id: 'pledge2', 
          projectId, 
          userId: 'user2', 
          amount: 300, 
          locked: false, 
          createdAt: '2023-01-01', 
          updatedAt: '2023-01-01',
          description: 'Test pledge 2'
        }
      ]
      
      mockPledgeCrud.getByProjectId.mockResolvedValue(pledges)
      
      // Act
      const result = await projectWorkflow.getProjectBalance(projectId)
      
      // Assert
      expect(mockPledgeCrud.getByProjectId).toHaveBeenCalledWith(projectId)
      expect(result).toBe(800) // 500 + 300
    })
  })
  
  describe('deleteProject', () => {
    it('should delete a project and all its pledges', async () => {
      // Arrange
      const projectId = 'proj1'
      const project = {
        id: projectId,
        name: 'Test Project',
        description: 'A test project',
        goal: 1000,
        ownerId: 'user1',
        closed: false,
        deleted: false,
        createdAt: '2023-01-01',
        updatedAt: '2023-01-01',
        fundsSentToOwner: false,
        bought: false,
        addedToAssetList: false,
        locked: false
      }
      
      const pledges: Pledge[] = [
        { 
          id: 'pledge1', 
          projectId, 
          userId: 'user1', 
          amount: 500, 
          locked: false, 
          createdAt: '2023-01-01', 
          updatedAt: '2023-01-01',
          description: 'Test pledge 1'
        },
        { 
          id: 'pledge2', 
          projectId, 
          userId: 'user2', 
          amount: 500, 
          locked: false, 
          createdAt: '2023-01-01', 
          updatedAt: '2023-01-01',
          description: 'Test pledge 2'
        }
      ]
      
      const deletedProject = {
        ...project,
        deleted: true,
        updatedAt: expect.any(String)
      }
      
      // Setup mocks
      mockProjectCrud.getById.mockResolvedValue(project)
      mockPledgeCrud.getByProjectId.mockResolvedValue(pledges)
      mockPledgeCrud.softDelete.mockImplementation((id) => 
        Promise.resolve({ ...pledges.find(p => p.id === id), deleted: true, updatedAt: new Date().toISOString() } as Pledge)
      )
      mockProjectCrud.softDelete.mockResolvedValue(deletedProject)
      
      // Act
      const result = await projectWorkflow.deleteProject(projectId)
      
      // Assert
      expect(runTransaction).toHaveBeenCalled()
      expect(mockProjectCrud.getById).toHaveBeenCalledWith(projectId)
      expect(mockPledgeCrud.getByProjectId).toHaveBeenCalledWith(projectId)
      expect(mockPledgeCrud.softDelete).toHaveBeenCalledTimes(pledges.length)
      expect(mockProjectCrud.softDelete).toHaveBeenCalledWith(projectId)
      expect(result).toEqual(deletedProject)
    })
  })
}) 