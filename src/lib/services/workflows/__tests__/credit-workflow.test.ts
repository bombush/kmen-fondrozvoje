import { CreditWorkflow } from '../credit-workflow'
import { CreditAwardCrud } from '../../crud/credit-award-crud'
import { UserCrud } from '../../crud/user-crud'
import { CreditAward, User } from '@/types'
import { runTransaction } from 'firebase/firestore'
import { BankPaymentCrud } from '../../crud/bank-crud'
import { BankPayment } from '@/types'

// Mock Firebase's runTransaction
jest.mock('firebase/firestore', () => ({
  runTransaction: jest.fn(async (db, callback) => callback({})),
}))

// Mock the CRUD classes
jest.mock('../../crud/credit-award-crud')
jest.mock('../../crud/user-crud')
jest.mock('../../crud/bank-crud')

// Add at the top of the file
jest.mock('../../../firebase/config', () => ({
  app: {},
  db: {},
}));

describe('CreditWorkflow', () => {
  let creditWorkflow: CreditWorkflow
  let mockCreditAwardCrud: jest.Mocked<CreditAwardCrud>
  let mockUserCrud: jest.Mocked<UserCrud>
  let mockBankPaymentCrud: jest.Mocked<BankPaymentCrud>
  
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks()
    
    // Create mock instances
    mockCreditAwardCrud = new CreditAwardCrud() as jest.Mocked<CreditAwardCrud>
    mockUserCrud = new UserCrud() as jest.Mocked<UserCrud>
    mockBankPaymentCrud = new BankPaymentCrud() as jest.Mocked<BankPaymentCrud>
    
    // Create workflow with mocked dependencies
    creditWorkflow = new CreditWorkflow()
    // @ts-ignore - access private properties for testing
    creditWorkflow.creditAwardCrud = mockCreditAwardCrud
    // @ts-ignore
    creditWorkflow.userCrud = mockUserCrud
    // @ts-ignore
    creditWorkflow.bankPaymentCrud = mockBankPaymentCrud
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
        deleted: false,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z'
      }
      
      mockCreditAwardCrud.create.mockResolvedValue(creditAward)
      
      // Act
      const result = await creditWorkflow.awardCredits({
        userId,
        amount,
        reason,
        ...options
      })
      
      // Assert
      expect(mockCreditAwardCrud.create).toHaveBeenCalledWith({
        userId,
        amount,
        reason,
        sourceId: 'manual_award',
        sourceType: 'admin',
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
        { id: 'user1', name: 'User 1', email: 'user1@example.com', role: 'user', isActive: true, createdAt: '2023-01-01T00:00:00Z', updatedAt: '2023-01-01T00:00:00Z' },
        { id: 'user2', name: 'User 2', email: 'user2@example.com', role: 'user', isActive: true, createdAt: '2023-01-01T00:00:00Z', updatedAt: '2023-01-01T00:00:00Z' }
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


  describe('updateCreditAllocationBasedOnPayments', () => {
    beforeEach(() => {
      // Reset mocks
      jest.clearAllMocks()
      
      // Create fresh mocks for this test suite
      mockCreditAwardCrud = new CreditAwardCrud() as jest.Mocked<CreditAwardCrud>
      mockBankPaymentCrud = new BankPaymentCrud() as jest.Mocked<BankPaymentCrud>
      
      // Set up credit workflow with mocks
      creditWorkflow = new CreditWorkflow()
      // @ts-ignore - access private properties for testing
      creditWorkflow.creditAwardCrud = mockCreditAwardCrud
      // @ts-ignore
      creditWorkflow.bankPaymentCrud = mockBankPaymentCrud
    })
    
    it('should distribute credits equally when there are payments but no existing awards', async () => {
      // Arrange
      const month = '2023-05'
      const payments = [
        { id: 'payment1', userId: 'user1', amount: 100, targetMonth: month },
        { id: 'payment2', userId: 'user2', amount: 200, targetMonth: month },
        { id: 'payment3', userId: 'user1', amount: 50, targetMonth: month }
      ] as BankPayment[]
      
      // Total payments: 350
      // Users: user1, user2
      // Credits per user: 175
      
      mockBankPaymentCrud.getPaymentsByMonth.mockResolvedValue(payments)
      mockCreditAwardCrud.getAutomaticAwardsByMonth.mockResolvedValue([])
      
      // Act
      await creditWorkflow.updateCreditAllocationBasedOnPayments(month)
      
      // Assert
      expect(mockBankPaymentCrud.getPaymentsByMonth).toHaveBeenCalledWith(month)
      expect(mockCreditAwardCrud.getAutomaticAwardsByMonth).toHaveBeenCalledWith(month)
      expect(runTransaction).toHaveBeenCalled()
      
      // Check that new awards were created for each user
      expect(mockCreditAwardCrud.create).toHaveBeenCalledTimes(2)
      expect(mockCreditAwardCrud.create).toHaveBeenNthCalledWith(1,
        expect.objectContaining({
          userId: 'user1',
          amount: 175,
          reason: 'monthly_allocation',
          targetMonth: month
        }),
        expect.anything()
      )
      expect(mockCreditAwardCrud.create).toHaveBeenNthCalledWith(2,
        expect.objectContaining({
          userId: 'user2',
          amount: 175,
          reason: 'monthly_allocation',
          targetMonth: month
        }),
        expect.anything()
      )
    })
    
    it('should update existing awards and create new ones as needed', async () => {
      // Arrange
      const month = '2023-06'
      const payments = [
        { id: 'payment1', userId: 'user1', amount: 100, targetMonth: month },
        { id: 'payment2', userId: 'user2', amount: 200, targetMonth: month },
        { id: 'payment3', userId: 'user3', amount: 300, targetMonth: month }
      ] as BankPayment[]
      
      const existingAwards = [
        { id: 'award1', userId: 'user1', amount: 50, reason: 'monthly_allocation', targetMonth: month },
        { id: 'award2', userId: 'user2', amount: 50, reason: 'monthly_allocation', targetMonth: month }
      ] as CreditAward[]
      
      // Total payments: 600
      // Users: user1, user2, user3
      // Credits per user: 200
      
      mockBankPaymentCrud.getPaymentsByMonth.mockResolvedValue(payments)
      mockCreditAwardCrud.getAutomaticAwardsByMonth.mockResolvedValue(existingAwards)
      
      // Act
      await creditWorkflow.updateCreditAllocationBasedOnPayments(month)
      
      // Assert
      expect(mockCreditAwardCrud.update).toHaveBeenCalledTimes(2)
      expect(mockCreditAwardCrud.create).toHaveBeenCalledTimes(1)
      
      // Check that existing awards were updated
      expect(mockCreditAwardCrud.update).toHaveBeenNthCalledWith(1,
        'award1',
        { amount: 200 },
        expect.anything()
      )
      expect(mockCreditAwardCrud.update).toHaveBeenNthCalledWith(2,
        'award2',
        { amount: 200 },
        expect.anything()
      )
      
      // Check that a new award was created for user3
      expect(mockCreditAwardCrud.create).toHaveBeenNthCalledWith(1,
        expect.objectContaining({
          userId: 'user3',
          amount: 200,
          reason: 'monthly_allocation',
          targetMonth: month
        }),
        expect.anything()
      )
    })
    
    it('should handle the case when there are no payments for the month', async () => {
      // Arrange
      const month = '2023-07'
      mockBankPaymentCrud.getPaymentsByMonth.mockResolvedValue([])
      mockCreditAwardCrud.getAutomaticAwardsByMonth.mockResolvedValue([])
      
      // Act
      await creditWorkflow.updateCreditAllocationBasedOnPayments(month)
      
      // Assert
      expect(mockBankPaymentCrud.getPaymentsByMonth).toHaveBeenCalledWith(month)
      expect(mockCreditAwardCrud.getAutomaticAwardsByMonth).toHaveBeenCalledWith(month)
      expect(runTransaction).toHaveBeenCalled()
      
      // No awards should be created or updated
      expect(mockCreditAwardCrud.create).not.toHaveBeenCalled()
      expect(mockCreditAwardCrud.update).not.toHaveBeenCalled()
    })
    
    it('should handle zero amount payments correctly', async () => {
      // Arrange
      const month = '2023-08'
      const payments = [
        { id: 'payment1', userId: 'user1', amount: 0, targetMonth: month },
        { id: 'payment2', userId: 'user2', amount: 300, targetMonth: month }
      ] as BankPayment[]
      
      mockBankPaymentCrud.getPaymentsByMonth.mockResolvedValue(payments)
      mockCreditAwardCrud.getAutomaticAwardsByMonth.mockResolvedValue([])
      
      // Act
      await creditWorkflow.updateCreditAllocationBasedOnPayments(month)
      
      // Assert
      // Only user2 should get an award (user1 has zero amount)
      expect(mockCreditAwardCrud.create).toHaveBeenCalledTimes(1)
      expect(mockCreditAwardCrud.create).toHaveBeenNthCalledWith(1,
        expect.objectContaining({
          userId: 'user2',
          amount: 300, // All credits go to the only contributor
          reason: 'monthly_allocation',
          targetMonth: month
        }),
        expect.anything()
      )
    })

    it('should only update monthly allocation awards and preserve manual awards', async () => {
      // Arrange
      const month = '2023-09'
      const payments = [
        { id: 'payment1', userId: 'user1', amount: 100, targetMonth: month },
        { id: 'payment2', userId: 'user2', amount: 200, targetMonth: month }
      ] as BankPayment[]
      
      // Mix of automatic and manual awards
      const existingAwards = [
        // Automatic awards that should be updated
        { id: 'award1', userId: 'user1', amount: 50, reason: 'monthly_allocation', targetMonth: month },
        
        // Manual awards that should not be modified
        { id: 'award2', userId: 'user1', amount: 75, reason: 'admin_award', targetMonth: month },
        { id: 'award3', userId: 'user2', amount: 25, reason: 'admin_award', targetMonth: month }
      ] as CreditAward[]
      
      // Only return the monthly_allocation awards when getAutomaticAwardsByMonth is called
      const automaticAwards = existingAwards.filter(award => award.reason === 'monthly_allocation')
      
      mockBankPaymentCrud.getPaymentsByMonth.mockResolvedValue(payments)
      mockCreditAwardCrud.getAutomaticAwardsByMonth.mockResolvedValue(automaticAwards)
      
      // Act
      await creditWorkflow.updateCreditAllocationBasedOnPayments(month)
      
      // Assert
      // We should only update the one monthly_allocation award
      expect(mockCreditAwardCrud.update).toHaveBeenCalledTimes(1)
      
      // Only the monthly allocation award should be updated with new amount
      expect(mockCreditAwardCrud.update).toHaveBeenCalledWith(
        'award1',
        { amount: 150 }, // 300 total / 2 users = 150 per user
        expect.anything()
      )
      
      // We should create a monthly_allocation award for user2 who doesn't have one
      expect(mockCreditAwardCrud.create).toHaveBeenCalledTimes(1)
      expect(mockCreditAwardCrud.create).toHaveBeenNthCalledWith(1,
        expect.objectContaining({
          userId: 'user2',
          amount: 150,
          reason: 'monthly_allocation',
          targetMonth: month
        }),
        expect.anything()
      )
      
      // Admin awards should not be modified
      expect(mockCreditAwardCrud.update).not.toHaveBeenCalledWith(
        'award2',
        expect.anything(),
        expect.anything()
      )
      expect(mockCreditAwardCrud.update).not.toHaveBeenCalledWith(
        'award3',
        expect.anything(),
        expect.anything()
      )
    })

    it('should correctly calculate per-user distribution regardless of manual awards', async () => {
      // Arrange
      const month = '2023-10'
      const payments = [
        { id: 'payment1', userId: 'user1', amount: 400, targetMonth: month },
        { id: 'payment2', userId: 'user2', amount: 200, targetMonth: month },
        { id: 'payment3', userId: 'user3', amount: 0, targetMonth: month } // User who made no payment
      ] as BankPayment[]
      
      // User3 has a manual award but no payment contribution
      const manualAward = { 
        id: 'award4', 
        userId: 'user3', 
        amount: 1000, 
        reason: 'admin_award', 
        targetMonth: month 
      } as CreditAward
      
      mockBankPaymentCrud.getPaymentsByMonth.mockResolvedValue(payments)
      mockCreditAwardCrud.getAutomaticAwardsByMonth.mockResolvedValue([])
      
      // Act
      await creditWorkflow.updateCreditAllocationBasedOnPayments(month)
      
      // Assert
      // Only 2 users made payments, so only they should get monthly allocation credits
      expect(mockCreditAwardCrud.create).toHaveBeenCalledTimes(2)
      
      // The total payment amount is 600, divided by 2 users = 300 per user
      expect(mockCreditAwardCrud.create).toHaveBeenNthCalledWith(1,
        expect.objectContaining({
          userId: 'user1',
          amount: 300,
          reason: 'monthly_allocation',
          targetMonth: month
        }),
        expect.anything()
      )
      
      expect(mockCreditAwardCrud.create).toHaveBeenNthCalledWith(2, 
        expect.objectContaining({
          userId: 'user2',
          amount: 300,
          reason: 'monthly_allocation',
          targetMonth: month
        }),
        expect.anything()
      )
      
      // User3 should not get a monthly allocation award
      expect(mockCreditAwardCrud.create).not.toHaveBeenCalledWith(1,
        expect.objectContaining({
          userId: 'user3',
          reason: 'monthly_allocation',
        }),
        expect.anything()
      )
    })
  })
}) 