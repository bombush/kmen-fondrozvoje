import { UserWorkflow } from '../user-workflow'
import { UserCrud } from '../../crud/user-crud'
import { CreditAwardCrud } from '../../crud/credit-award-crud'
import { PledgeCrud } from '../../crud/pledge-crud'
import { CreditWorkflow } from '../credit-workflow'
import { User, Pledge } from '@/types'
import { runTransaction } from 'firebase/firestore'

// Mock Firebase's runTransaction
jest.mock('firebase/firestore', () => ({
  runTransaction: jest.fn(async (db, callback) => callback()),
}))

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
  })
  
  describe('updateUser', () => {
    it('should update an existing user', async () => {
      // Arrange
      const userId = 'user1'
      const userData = {
        name: 'Updated Name'
      }
      
      const existingUser = {
        id: userId,
        name: 'Original Name',
        email: 'test@example.com',
        role: 'user' as const,
        isActive: true,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z'
      }
      
      const updatedUser = {
        ...existingUser,
        name: 'Updated Name',
        updatedAt: '2023-01-02T00:00:00Z'
      }
      
      mockUserCrud.getById.mockResolvedValue(existingUser)
      mockUserCrud.update.mockResolvedValue(updatedUser)
      
      // Act
      const result = await userWorkflow.updateUser(userId, userData)
      
      // Assert
      expect(mockUserCrud.getById).toHaveBeenCalledWith(userId)
      expect(mockUserCrud.update).toHaveBeenCalledWith(userId, userData)
      expect(result).toEqual(updatedUser)
    })
    
    it('should throw an error if user not found', async () => {
      // Arrange
      const userId = 'nonexistent'
      const userData = { name: 'Updated Name' }
      
      mockUserCrud.getById.mockResolvedValue(null)
      
      // Act & Assert
      await expect(userWorkflow.updateUser(userId, userData)).rejects.toThrow(
        `User ${userId} not found`
      )
    })
  })
  
  describe('getUserBalance', () => {
    it('should return the user balance', async () => {
      // Arrange
      const userId = 'user1'
      const balance = 500
      
      mockUserCrud.calculateBalance.mockResolvedValue(balance)
      
      // Act
      const result = await mockUserCrud.getBalance(userId)
      
      // Assert
      expect(mockUserCrud.calculateBalance).toHaveBeenCalledWith(userId)
      expect(result).toBe(balance)
    })
  })
  
  describe('awardCreditsToUser', () => {
    it('should award credits to a user and return the updated user', async () => {
      // Arrange
      const userId = 'user1'
      const amount = 100
      const reason = 'admin_award' as const
      const notes = 'Test award'
      
      const user = {
        id: userId,
        name: 'Test User',
        email: 'test@example.com',
        role: 'user' as const,
        isActive: true,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z'
      }
      
      mockCreditWorkflow.awardCredits.mockResolvedValue({
        id: 'award1',
        userId,
        amount,
        reason,
        notes,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z'
      })
      
      mockUserCrud.getById.mockResolvedValue(user)
      
      // Act
      const result = await userWorkflow.awardCreditsToUser(userId, amount, reason, notes)
      
      // Assert
      expect(mockCreditWorkflow.awardCredits).toHaveBeenCalledWith(
        userId,
        amount,
        reason,
        { notes }
      )
      expect(mockUserCrud.getById).toHaveBeenCalledWith(userId)
      expect(result).toEqual(user)
    })
    
    it('should throw an error if user not found after awarding credits', async () => {
      // Arrange
      const userId = 'nonexistent'
      const amount = 100
      const reason = 'admin_award' as const
      
      mockCreditWorkflow.awardCredits.mockResolvedValue({
        id: 'award1',
        userId,
        amount,
        reason,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z'
      })
      
      mockUserCrud.getById.mockResolvedValue(null)
      
      // Act & Assert
      await expect(userWorkflow.awardCreditsToUser(userId, amount, reason)).rejects.toThrow(
        `User ${userId} not found`
      )
    })
  })
  
  describe('generateUniqueSpecificSymbol', () => {
    it('should generate a unique specific symbol', async () => {
      // Arrange
      const users: User[] = [
        { 
          id: 'user1', 
          name: 'User 1', 
          email: 'user1@example.com', 
          role: 'user', 
          isActive: true, 
          specificSymbol: '1234567890',
          createdAt: '2023-01-01', 
          updatedAt: '2023-01-01' 
        },
        { 
          id: 'user2', 
          name: 'User 2', 
          email: 'user2@example.com', 
          role: 'user', 
          isActive: true, 
          specificSymbol: '0987654321',
          createdAt: '2023-01-01', 
          updatedAt: '2023-01-01' 
        }
      ]
      
      mockUserCrud.getAll.mockResolvedValue(users)
      
      // Mock Math.random to return predictable values
      const originalRandom = Math.random
      Math.random = jest.fn()
        .mockReturnValueOnce(0.1) // This would generate '1900000000' (which is in use)
        .mockReturnValueOnce(0.5) // This would generate '5500000000' (not in use)
      
      // Act
      const result = await userWorkflow.generateUniqueSpecificSymbol()
      
      // Restore Math.random
      Math.random = originalRandom
      
      // Assert
      expect(mockUserCrud.getAll).toHaveBeenCalled()
      expect(result).toBeTruthy()
      expect(result).not.toBe('1234567890')
      expect(result).not.toBe('0987654321')
      expect(result.length).toBe(10)
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
      mockUserCrud.softDelete.mockResolvedValue(deletedUser)
      
      // Act
      const result = await userWorkflow.deleteUser(userId)
      
      // Assert
      expect(runTransaction).toHaveBeenCalled()
      expect(mockUserCrud.getById).toHaveBeenCalledWith(userId, expect.anything())
      expect(mockPledgeCrud.getByUserId).toHaveBeenCalledWith(userId)
      expect(mockPledgeCrud.softDelete).toHaveBeenCalledTimes(pledges.length)
      expect(mockUserCrud.softDelete).toHaveBeenCalledWith(userId, expect.anything())
      expect(result).toEqual(deletedUser)
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