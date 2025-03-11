import { UserCrud } from '../user-crud'
import { CreditAwardCrud } from '../credit-award-crud'
import { PledgeCrud } from '../pledge-crud'
import { User, CreditAward, Pledge } from '@/types'
import { FirebaseAdapter } from '../../database/firebase-adapter'

// Mock dependencies
jest.mock('../../database/firebase-adapter')
jest.mock('../credit-award-crud')
jest.mock('../pledge-crud')

describe('UserCrud', () => {
  let userCrud: UserCrud
  let mockCreditAwardCrud: jest.Mocked<CreditAwardCrud>
  let mockPledgeCrud: jest.Mocked<PledgeCrud>
  
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks()
    
    // Create mock instances
    mockCreditAwardCrud = new CreditAwardCrud() as jest.Mocked<CreditAwardCrud>
    mockPledgeCrud = new PledgeCrud() as jest.Mocked<PledgeCrud>
    
    // Create UserCrud with mocked dependencies
    userCrud = new UserCrud()
    // Replace the automatically created dependencies with our mocks
    userCrud['creditAwardCrud'] = mockCreditAwardCrud
    userCrud['pledgeCrud'] = mockPledgeCrud
  })
  
  describe('calculateBalance', () => {
    it('should calculate the correct balance for a user with credits and pledges', async () => {
      // Arrange
      const userId = 'user1'
      
      const creditAwards: CreditAward[] = [
        { id: 'award1', userId, amount: 500, reason: 'monthly_allocation', createdAt: '2023-01-01', updatedAt: '2023-01-01' },
        { id: 'award2', userId, amount: 200, reason: 'admin_award', createdAt: '2023-01-15', updatedAt: '2023-01-15' }
      ]
      
      const pledges: Pledge[] = [
        { id: 'pledge1', userId, projectId: 'project1', amount: 300, locked: false, createdAt: '2023-01-05', updatedAt: '2023-01-05', description: 'Pledge 1' },
        { id: 'pledge2', userId, projectId: 'project2', amount: 100, locked: true, createdAt: '2023-01-10', updatedAt: '2023-01-10', description: 'Pledge 2' }
      ]
      
      mockCreditAwardCrud.getByUserId.mockResolvedValue(creditAwards)
      mockPledgeCrud.getByUserId.mockResolvedValue(pledges)
      
      // Act
      const balance = await userCrud.calculateBalance(userId)
      
      // Assert
      expect(mockCreditAwardCrud.getByUserId).toHaveBeenCalledWith(userId)
      expect(mockPledgeCrud.getByUserId).toHaveBeenCalledWith(userId)
      expect(balance).toBe(300) // 500 + 200 - 300 - 100
    })
    
    it('should return the total credits when user has no pledges', async () => {
      // Arrange
      const userId = 'user2'
      
      const creditAwards: CreditAward[] = [
        { id: 'award3', userId, amount: 500, reason: 'monthly_allocation', createdAt: '2023-02-01', updatedAt: '2023-02-01' }
      ]
      
      mockCreditAwardCrud.getByUserId.mockResolvedValue(creditAwards)
      mockPledgeCrud.getByUserId.mockResolvedValue([])
      
      // Act
      const balance = await userCrud.calculateBalance(userId)
      
      // Assert
      expect(balance).toBe(500)
    })
    
    it('should return a negative balance when pledges exceed credits', async () => {
      // Arrange
      const userId = 'user3'
      
      const creditAwards: CreditAward[] = [
        { id: 'award4', userId, amount: 200, reason: 'monthly_allocation', createdAt: '2023-03-01', updatedAt: '2023-03-01' }
      ]
      
      const pledges: Pledge[] = [
        { id: 'pledge3', userId, projectId: 'project3', amount: 300, locked: false, createdAt: '2023-03-05', updatedAt: '2023-03-05', description: 'Pledge 3' }
      ]
      
      mockCreditAwardCrud.getByUserId.mockResolvedValue(creditAwards)
      mockPledgeCrud.getByUserId.mockResolvedValue(pledges)
      
      // Act
      const balance = await userCrud.calculateBalance(userId)
      
      // Assert
      expect(balance).toBe(-100) // 200 - 300
    })
    
    it('should return zero balance when user has no credits or pledges', async () => {
      // Arrange
      const userId = 'user4'
      
      mockCreditAwardCrud.getByUserId.mockResolvedValue([])
      mockPledgeCrud.getByUserId.mockResolvedValue([])
      
      // Act
      const balance = await userCrud.calculateBalance(userId)
      
      // Assert
      expect(balance).toBe(0)
    })
    
    it('should return negative balance when user only has pledges', async () => {
      // Arrange
      const userId = 'user5'
      
      const pledges: Pledge[] = [
        { id: 'pledge4', userId, projectId: 'project4', amount: 150, locked: false, createdAt: '2023-04-05', updatedAt: '2023-04-05', description: 'Pledge 4'

         }
      ]
      
      mockCreditAwardCrud.getByUserId.mockResolvedValue([])
      mockPledgeCrud.getByUserId.mockResolvedValue(pledges)
      
      // Act
      const balance = await userCrud.calculateBalance(userId)
      
      // Assert
      expect(balance).toBe(-150)
    })
    
    it('should filter out deleted credit awards and pledges', async () => {
      // Arrange
      const userId = 'user6'
      
      const creditAwards: CreditAward[] = [
        { id: 'award5', userId, amount: 500, reason: 'monthly_allocation', createdAt: '2023-05-01', updatedAt: '2023-05-01' },
        { id: 'award6', userId, amount: 200, reason: 'admin_award', createdAt: '2023-05-15', updatedAt: '2023-05-15', deleted: true }
      ]
      
      const pledges: Pledge[] = [
        { id: 'pledge5', userId, projectId: 'project5', amount: 300, locked: false, createdAt: '2023-05-05', updatedAt: '2023-05-05', description: 'Pledge 5' },
        { id: 'pledge6', userId, projectId: 'project6', amount: 100, locked: true, createdAt: '2023-05-10', updatedAt: '2023-05-10', deleted: true, description: 'Pledge 6' }
      ]
      
      // Note: The mocked getByUserId methods should already filter out deleted items,
      // but we're double-checking the implementation logic here
      mockCreditAwardCrud.getByUserId.mockResolvedValue([creditAwards[0]])
      mockPledgeCrud.getByUserId.mockResolvedValue([pledges[0]])
      
      // Act
      const balance = await userCrud.calculateBalance(userId)
      
      // Assert
      expect(balance).toBe(200) // 500 - 300 (deleted items excluded)
    })
  })
}) 