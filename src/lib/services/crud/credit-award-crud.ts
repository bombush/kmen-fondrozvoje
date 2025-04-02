import { CreditAward } from "@/types"
import { QueryConstraint } from "../database/database-adapter"
import { FirebaseAdapter } from "../database/firebase-adapter"
import { BaseCrud } from "./base-crud"
import { Transaction } from "firebase/firestore"

const COLLECTION_NAME = "creditAwards"

export class CreditAwardCrud extends BaseCrud<CreditAward> {
  constructor() {
    super(new FirebaseAdapter<CreditAward>(COLLECTION_NAME))
  }

  async create(
    data: Omit<CreditAward, "id" | "createdAt" | "updatedAt" | "deleted">,
    transaction?: Transaction
  ): Promise<CreditAward> {
    return super.create({
      ...data,
      deleted: false
    })
  }

  async update(
    id: string, 
    data: Partial<CreditAward>, 
    transaction?: Transaction
  ): Promise<CreditAward> {
    return super.update(id, data)
  }

  async softDelete(id: string): Promise<CreditAward> {
    return this.update(id, { deleted: true })
  }

  async getById(id: string, transaction?: Transaction): Promise<CreditAward | null> {
    return super.getById(id)
  }

  /**
   * Get all credit awards for a specific user
   */
  async getByUserId(userId: string): Promise<CreditAward[]> {
    return this.query([
      { field: "userId", operator: "==", value: userId },
      { field: "deleted", operator: "==", value: false }
    ])
  }

  /**
   * Get all credit awards for a specific month
   */
  async getByMonth(month: string): Promise<CreditAward[]> {
    return this.query([
      { field: "targetMonth", operator: "==", value: month },
      { field: "deleted", operator: "==", value: false }
    ])
  }

  /**
   * Get all credit awards by reason
   */
  async getByReason(reason: CreditAward['reason']): Promise<CreditAward[]> {
    return this.query([
      { field: "reason", operator: "==", value: reason },
      { field: "deleted", operator: "==", value: false }
    ])
  }

  /**
   * Get credit awards for a specific source (e.g., project, payment)
   */
  async getBySource(sourceType: string, sourceId: string): Promise<CreditAward[]> {
    return this.query([
      { field: "sourceType", operator: "==", value: sourceType },
      { field: "sourceId", operator: "==", value: sourceId },
      { field: "deleted", operator: "==", value: false }
    ])
  }

  /**
   * Calculate total credits awarded to a user
   */
  async getTotalCreditsByUser(userId: string): Promise<number> {
    const awards = await this.getByUserId(userId)
    return awards.reduce((total, award) => total + award.amount, 0)
  }

  /**
   * Calculate total credits awarded in a specific month
   */
  async getTotalCreditsByMonth(month: string): Promise<number> {
    const awards = await this.getByMonth(month)
    return awards.reduce((total, award) => total + award.amount, 0)
  }

  /**
   * Get paginated credit awards
   * @param constraints Query constraints
   * @param limit Number of items per page
   * @param startAfter Document to start after (cursor for pagination)
   */
  async getWithPagination(
    constraints: QueryConstraint[] = [],
    limit: number = 40,
    startAfter?: CreditAward | null
  ): Promise<CreditAward[]> {
    const adapter = this.db as FirebaseAdapter<CreditAward>
    
    // Create a basic query with constraints
    let query = adapter.createQueryWithConstraints(constraints)
    
    // Apply sorting - sort by createdAt in descending order
    query = adapter.addOrderBy(query, 'createdAt', 'desc')
    
    // Apply limit
    query = adapter.addLimit(query, limit)
    
    // Apply startAfter if provided
    if (startAfter) {
      query = await adapter.addStartAfter(query, startAfter)
    }
    
    // Execute the query
    return adapter.executeQuery(query)
  }

  /**
   * Get credit awards with pagination and filtering
   */
  async getPaginatedAwards(
    reasonFilter: string = 'all',
    userFilter: string = 'all',
    monthFilter: string = 'all',
    pageParam: CreditAward | null,
    pageSize: number = 40
  ): Promise<CreditAward[]> {
    // Base query constraints
    const constraints: QueryConstraint[] = [];
    
    // Add reason filter if not "all"
    if (reasonFilter !== "all") {
      constraints.push({ field: "reason", operator: "==", value: reasonFilter });
    }
    
    // Add user filter if not "all"
    if (userFilter !== "all") {
      constraints.push({ field: "userId", operator: "==", value: userFilter });
    }
    
    // Add month filter if not "all"
    if (monthFilter !== "all") {
      constraints.push({ field: "targetMonth", operator: "==", value: monthFilter });
    }
    
    // Always filter out deleted awards
    constraints.push({ field: "deleted", operator: "==", value: false });
    
    // Use the existing pagination method
    return this.getWithPagination(constraints, pageSize, pageParam);
  }

  /**
   * Get month range for filtering
   * Returns array of months between earliest and latest targetMonth in database
   */
  async getMonthRange(): Promise<{ value: string; label: string }[]> {
    const adapter = this.db as FirebaseAdapter<CreditAward>;
    
    // Create query to find all unique targetMonths, sorted ascending
    const constraints: QueryConstraint[] = [
      {
        field: "deleted",
        operator: "==" as const,
        value: false
      },
      {
        field: "targetMonth",
        operator: "!=" as const,
        value: null
      }
    ];
    
    let query = adapter.createQueryWithConstraints(constraints);
    query = adapter.addOrderBy(query, 'targetMonth', 'asc');
    
    const awards = await adapter.executeQuery(query);
    
    // Find unique months from the data
    const uniqueMonths = new Set<string>();
    
    awards.forEach(award => {
      if (award.targetMonth) {
        uniqueMonths.add(award.targetMonth);
      }
    });
    
    // Convert to array and format for select component
    return Array.from(uniqueMonths).map(month => {
      const [year, monthNum] = month.split('-');
      const date = new Date(parseInt(year), parseInt(monthNum) - 1);
      const monthName = date.toLocaleString('default', { month: 'long' });
      
      return {
        value: month,
        label: `${monthName} ${year}`
      };
    }).sort((a, b) => b.value.localeCompare(a.value)); // Sort newest to oldest
  }
} 