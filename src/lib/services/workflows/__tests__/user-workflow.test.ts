import { UserWorkflow } from '../user-workflow'
import { UserCrud } from '../../crud/user-crud'
import { CreditAwardCrud } from '../../crud/credit-award-crud'
import { PledgeCrud } from '../../crud/pledge-crud'
import { CreditWorkflow } from '../credit-workflow'
import { User, Pledge } from '@/types'
import { runTransaction } from 'firebase/firestore'


// Mock the CRUD classes and CreditWorkflow
jest.mock('../../crud/user-crud')
jest.mock('../../crud/credit-award-crud')
jest.mock('../../crud/pledge-crud')
jest.mock('../credit-workflow')

describe('UserWorkflow', () => {
  let userWorkflow: UserWorkflow
  let mockUserCrud: jest.Mocked<UserCrud>
  let mockCreditAwardCrud: jest.Mocked<CreditAwardCrud>
  let mockPledgeCrud: jest.Mocked<PledgeCrud>
  let mockCreditWorkflow: jest.Mocked<CreditWorkflow>
  
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks()
    
    // Create mock instances
    mockUserCrud = new UserCrud() as jest.Mocked<UserCrud>
    mockCreditAwardCrud = new CreditAwardCrud() as jest.Mocked<CreditAwardCrud>
    mockPledgeCrud = new PledgeCrud() as jest.Mocked<PledgeCrud>
    mockCreditWorkflow = new CreditWorkflow() as jest.Mocked<CreditWorkflow>
    
    // Create workflow with mocked dependencies
    userWorkflow = new UserWorkflow()
    // @ts-ignore - access private properties for testing
    userWorkflow.userCrud = mockUserCrud
    // @ts-ignore
    userWorkflow.creditAwardCrud = mockCreditAwardCrud
    // @ts-ignore
    userWorkflow.pledgeCrud = mockPledgeCrud
    // @ts-ignore
    userWorkflow.creditWorkflow = mockCreditWorkflow
  })
  
  describe('createUser', () => {
    it('should create a new user with default isActive value', async () => {
      // Arrange
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        role: 'user' as const
      }
      
      const createdUser = {
        id: 'user1',
        ...userData,
        isActive: true,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z'
      }
      
      mockUserCrud.create.mockResolvedValue(createdUser)
      
      // Act
      const result = await userWorkflow.createUser(userData)
      
      // Assert
      expect(mockUserCrud.create).toHaveBeenCalledWith({
        ...userData,
        isActive: true
      })
      expect(result).toEqual(createdUser)
    })
    
    it('should create a new user with provided isActive value', async () => {
      // Arrange
      const userData = {
        name: 'Inactive User',
        email: 'inactive@example.com',
        role: 'user' as const,
        isActive: false
      }
      
      const createdUser = {
        id: 'user2',
        ...userData,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z'
      }
      
      mockUserCrud.create.mockResolvedValue(createdUser)
      
      // Act
      const result = await userWorkflow.createUser(userData)
      
      // Assert
      expect(mockUserCrud.create).toHaveBeenCalledWith(userData)
      expect(result).toEqual(createdUser)
    })
    
    it('should create a new user with unique email and specific symbol', async () => {
      // Arrange
      const userData = {
        name: 'Test User',
        email: 'unique@example.com',
        role: 'user' as const,
        specificSymbol: 'UNIQUE123'
      }
      
      const createdUser = {
        id: 'user1',
        ...userData,
        isActive: true,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z'
      }
      
      // Mock that no users with this email or specific symbol exist
      mockUserCrud.getByEmail.mockResolvedValue(null)
      mockUserCrud.getBySpecificSymbol.mockResolvedValue(null)
      mockUserCrud.create.mockResolvedValue(createdUser)
      
      // Act
      const result = await userWorkflow.createUser(userData)
      
      // Assert
      expect(mockUserCrud.getByEmail).toHaveBeenCalledWith(userData.email)
      expect(mockUserCrud.getBySpecificSymbol).toHaveBeenCalledWith(userData.specificSymbol)
      expect(mockUserCrud.create).toHaveBeenCalledWith({
        ...userData,
        isActive: true
      })
      expect(result).toEqual(createdUser)
    })
    
    it('should throw an error when email already exists', async () => {
      // Arrange
      const userData = {
        name: 'Test User',
        email: 'existing@example.com',
        role: 'user' as const,
        specificSymbol: 'UNIQUE123'
      }
      
      const existingUser = {
        id: 'existing1',
        name: 'Existing User',
        email: 'existing@example.com',
        role: 'user' as const,
        isActive: true,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z'
      }
      
      // Mock that a user with this email already exists
      mockUserCrud.getByEmail.mockResolvedValue(existingUser as User)
      mockUserCrud.getBySpecificSymbol.mockResolvedValue(null)
      
      // Act & Assert
      await expect(userWorkflow.createUser(userData)).rejects.toThrow(
        'A user with this email already exists'
      )
      expect(mockUserCrud.create).not.toHaveBeenCalled()
    })
    
    it('should throw an error when specific symbol already exists', async () => {
      // Arrange
      const userData = {
        name: 'Test User',
        email: 'unique@example.com',
        role: 'user' as const,
        specificSymbol: 'EXISTING123'
      }
      
      const existingUser = {
        id: 'existing1',
        name: 'Existing User',
        email: 'different@example.com',
        role: 'user' as const,
        specificSymbol: 'EXISTING123',
        isActive: true,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z'
      }
      
      // Mock that a user with this specific symbol already exists
      mockUserCrud.getByEmail.mockResolvedValue(null)
      mockUserCrud.getBySpecificSymbol.mockResolvedValue(existingUser as User)
      
      // Act & Assert
      await expect(userWorkflow.createUser(userData)).rejects.toThrow(
        'A user with this specific symbol already exists'
      )
      expect(mockUserCrud.create).not.toHaveBeenCalled()
    })
  })
  
  
  describe('deleteUser', () => {
    it('should delete a user and all their pledges', async () => {
      // Arrange
      const userId = 'user1'
      const user = {
        id: userId,
        name: 'Test User',
        email: 'test@example.com',
        role: 'user' as const,
        isActive: true,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z'
      }
      
      const pledges: Pledge[] = [
        { id: 'pledge1', userId, projectId: 'project1', amount: 100, locked: false, createdAt: '2023-01-01', updatedAt: '2023-01-01', description: 'Pledge 1' },
        { id: 'pledge2', userId, projectId: 'project2', amount: 200, locked: false, createdAt: '2023-01-01', updatedAt: '2023-01-01', description: 'Pledge 2' }
      ]
      
      const deletedUser = {
        ...user,
        deleted: true,
        updatedAt: '2023-01-02T00:00:00Z'
      }
      
      mockUserCrud.getById.mockResolvedValue(user)
      mockPledgeCrud.getByUserId.mockResolvedValue(pledges)
      mockPledgeCrud.softDelete.mockImplementation((id) => 
        Promise.resolve({ ...pledges.find(p => p.id === id), deleted: true, updatedAt: new Date().toISOString() } as Pledge)
      )
      mockUserCrud.softDelete.mockResolvedValue()
      
      // Act
      const result = await userWorkflow.deleteUser(userId)
      
      // Assert
      expect(runTransaction).toHaveBeenCalled()
      expect(mockUserCrud.getById).toHaveBeenCalledWith(userId)
      expect(mockPledgeCrud.getByUserId).toHaveBeenCalledWith(userId)
      expect(mockPledgeCrud.softDelete).toHaveBeenCalledTimes(pledges.length)
      expect(mockUserCrud.softDelete).toHaveBeenCalledWith(userId)
      expect(result).toBeUndefined()
    })
    
    it('should throw an error if user not found', async () => {
      // Arrange
      const userId = 'nonexistent'
      
      mockUserCrud.getById.mockResolvedValue(null)
      
      // Act & Assert
      await expect(userWorkflow.deleteUser(userId)).rejects.toThrow(
        `User ${userId} not found`
      )
    })
  })
}) 