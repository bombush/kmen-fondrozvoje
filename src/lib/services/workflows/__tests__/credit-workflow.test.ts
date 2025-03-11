import { CreditWorkflow } from '../credit-workflow'
import { CreditAwardCrud } from '../../crud/credit-award-crud'
import { UserCrud } from '../../crud/user-crud'
import { CreditAward, User } from '@/types'
import { runTransaction } from 'firebase/firestore'

// Mock Firebase's runTransaction
jest.mock('firebase/firestore', () => ({
  runTransaction: jest.fn(async (db, callback) => callback()),
}))

// Mock the CRUD classes
jest.mock('../../crud/credit-award-crud')
jest.mock('../../crud/user-crud')

describe('CreditWorkflow', () => {
  let creditWorkflow: CreditWorkflow
  let mockCreditAwardCrud: jest.Mocked<CreditAwardCrud>
  let mockUserCrud: jest.Mocked<UserCrud>
  
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks()
    
    // Create mock instances
    mockCreditAwardCrud = new CreditAwardCrud() as jest.Mocked<CreditAwardCrud>
    mockUserCrud = new UserCrud() as jest.Mocked<UserCrud>
    
    // Create workflow with mocked dependencies
    creditWorkflow = new CreditWorkflow()
    // @ts-ignore - access private properties for testing
    creditWorkflow.creditAwardCrud = mockCreditAwardCrud
    // @ts-ignore
    creditWorkflow.userCrud = mockUserCrud
  })
  
  describe('awardCredits', () => {
    it('should create a credit award record', async () => {
      // Arrange
      const userId = 'user1'
      const amount = 100
      const reason = 'admin_award' as const
      const options = {
        notes: 'Test award',
        targetMonth: '2023-01'
      }
      
      const creditAward: CreditAward = {
        id: 'award1',
        userId,
        amount,
        reason,
        ...options,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z'
      }
      
      mockCreditAwardCrud.create.mockResolvedValue(creditAward)
      
      // Act
      const result = await creditWorkflow.awardCredits(userId, amount, reason, options)
      
      // Assert
      expect(mockCreditAwardCrud.create).toHaveBeenCalledWith({
        userId,
        amount,
        reason,
        ...options
      })
      expect(result).toEqual(creditAward)
    })
  })
  
  describe('awardMonthlyCreditToUsers', () => {
    it('should award credits to all active users', async () => {
      // Arrange
      const month = '2023-01'
      const creditAmount = 100
      const notes = 'Monthly credits'
      
      const activeUsers: User[] = [
        { id: 'user1', name: 'User 1', email: 'user1@example.com', role: 'user', isActive: true },
        { id: 'user2', name: 'User 2', email: 'user2@example.com', role: 'user', isActive: true }
      ]
      
      const creditAwards: CreditAward[] = [
        {
          id: 'award1',
          userId: 'user1',
          amount: creditAmount,
          reason: 'monthly_allocation',
          targetMonth: month,
          notes,
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z'
        },
        {
          id: 'award2',
          userId: 'user2',
          amount: creditAmount,
          reason: 'monthly_allocation',
          targetMonth: month,
          notes,
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z'
        }
      ]
      
      mockUserCrud.getActiveUsers.mockResolvedValue(activeUsers)
      mockCreditAwardCrud.create.mockImplementation((data) => {
        const award = creditAwards.find(a => a.userId === data.userId)
        return Promise.resolve(award as CreditAward)
      })
      
      // Act
      const result = await creditWorkflow.awardMonthlyCreditToUsers(month, creditAmount, notes)
      
      // Assert
      expect(runTransaction).toHaveBeenCalled()
      expect(mockUserCrud.getActiveUsers).toHaveBeenCalled()
      expect(mockCreditAwardCrud.create).toHaveBeenCalledTimes(activeUsers.length)
      expect(result).toEqual(creditAwards)
    })
  })
  
  describe('calculateUserBalance', () => {
    it('should calculate the sum of all credit awards for a user', async () => {
      // Arrange
      const userId = 'user1'
      const creditAwards: CreditAward[] = [
        { id: 'award1', userId, amount: 100, reason: 'monthly_allocation', createdAt: '2023-01-01', updatedAt: '2023-01-01' },
        { id: 'award2', userId, amount: 50, reason: 'admin_award', createdAt: '2023-01-15', updatedAt: '2023-01-15' }
      ]
      
      mockCreditAwardCrud.getByUserId.mockResolvedValue(creditAwards)
      
      // Act
      const result = await creditWorkflow.calculateUserBalance(userId)
      
      // Assert
      expect(mockCreditAwardCrud.getByUserId).toHaveBeenCalledWith(userId)
      expect(result).toBe(150) // 100 + 50
    })
  })
  
  describe('refundPledgeCredits', () => {
    it('should create a refund credit award', async () => {
      // Arrange
      const pledgeId = 'pledge1'
      const userId = 'user1'
      const amount = 100
      const projectId = 'proj1'
      
      const creditAward: CreditAward = {
        id: 'award1',
        userId,
        amount,
        reason: 'refund',
        sourceId: pledgeId,
        sourceType: 'pledge',
        notes: `Refund from project ${projectId}`,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z'
      }
      
      // Mock the awardCredits method
      jest.spyOn(creditWorkflow, 'awardCredits').mockResolvedValue(creditAward)
      
      // Act
      const result = await creditWorkflow.refundPledgeCredits(pledgeId, userId, amount, projectId)
      
      // Assert
      expect(creditWorkflow.awardCredits).toHaveBeenCalledWith(
        userId,
        amount,
        'refund',
        {
          sourceId: pledgeId,
          sourceType: 'pledge',
          notes: `Refund from project ${projectId}`
        }
      )
      expect(result).toEqual(creditAward)
    })
  })
}) 