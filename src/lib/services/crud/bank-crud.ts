import { BankPayment, BankStatement } from "@/types"
import { FirebaseAdapter } from "../database/firebase-adapter"
import { QueryConstraint } from "@/lib/services/database/database-adapter"
import { BaseCrud } from "./base-crud"
import { query, Transaction } from "firebase/firestore"
import { PaymentsQueryConfig } from "@/hooks/use-payments"

export class BankStatementCrud extends BaseCrud<BankStatement> {
  constructor() {
    super(new FirebaseAdapter<BankStatement>("bankStatements"))
  }

  async getById(id: string): Promise<BankStatement | null> {
    return super.getById(id)
  }

  async create(data: Omit<BankStatement, "id" | "createdAt" | "updatedAt">, transaction?: Transaction): Promise<BankStatement> {
    return super.create(data, transaction)
  }

  async update(id: string, data: Partial<BankStatement>, transaction?: Transaction): Promise<BankStatement> {
    return super.update(id, data, transaction )
  }

  async getByMonth(month: string): Promise<BankStatement[]> {
    return this.query([{
      field: "month",
      operator: "==",
      value: month
    }])
  }

  async getLatest(limit = 10): Promise<BankStatement[]> {
    const statements = await this.query([
      { field: "deleted", operator: "==", value: false }
    ]);
    
    // Sort by timestamp (most recent first)
    return statements
      .sort((a, b) => new Date(b.timestampOfStatement).getTime() - new Date(a.timestampOfStatement).getTime())
      .slice(0, limit);
  }
}

export type SortConfig = {
  field: keyof BankPayment;
  direction: 'asc' | 'desc';
}

export class BankPaymentCrud extends BaseCrud<BankPayment> {
  constructor() {
    super(new FirebaseAdapter<BankPayment>("bankPayments"))
  }

  async getById(id: string): Promise<BankPayment | null> {
    return super.getById(id)
  }

  async create(data: Omit<BankPayment, "id" | "createdAt" | "updatedAt">, transaction?: Transaction): Promise<BankPayment> {
    return super.create({
      ...data,
      deleted: false
    }, transaction)
  }

  async update(id: string, data: Partial<BankPayment>, transaction?: Transaction): Promise<BankPayment> {
    return super.update(id, data, transaction)
  }

  async softDelete(id: string, transaction?: Transaction): Promise<BankPayment> {
    return this.update(id, { deleted: true }, transaction)
  }

  async getByStatementId(statementId: string): Promise<BankPayment[]> {
    return this.query([
      {
        field: "statementId",
        operator: "==",
        value: statementId
      },
      {
        field: "deleted",
        operator: "==",
        value: false
      }
    ])
  }

  async getByMonth(month: string): Promise<BankPayment[]> {
    return this.query([
      {
        field: "targetMonth",
        operator: "==",
        value: month
      },
      {
        field: "deleted",
        operator: "==",
        value: false
      }
    ])
  }

  async getByUserId(userId: string): Promise<BankPayment[]> {
    return this.query([
      {
        field: "userId",
        operator: "==",
        value: userId
      },
      {
        field: "deleted",
        operator: "==",
        value: false
      }
    ])
  }

  async getByBankTransaction(bankTransactionId: string, bankAccountNumber: string, bankCode: string, includeDeleted?: boolean): Promise<BankPayment[]> {
    const query = [
      {field: "bankTransactionId", operator: "==", value: bankTransactionId },
      {field: "myAccountNumber", operator: "==", value: bankAccountNumber },
      {field: "myBankCode", operator: "==", value: bankCode},
    ] as QueryConstraint[]  

    if(!includeDeleted) {
      query.push({ field: "deleted", operator: "==", value: false })
    }

    return this.query(query)
  }

  async getFiltered(
    params: BankPaymentsFilterParams, 
    includeDeleted = false,
    sortConfig?: SortConfig
  ): Promise<BankPayment[]> {
    // Create an empty array of query constraints
    const queryConstraints: QueryConstraint[] = []
    
    // Only add constraints for properties that have defined values
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryConstraints.push({
          field: key, 
          operator: "==",
          value: value
        })
      }
    })
    
    if(!includeDeleted) {
      queryConstraints.push({
        field: "deleted",
        operator: "==",
        value: false
      })
    }
    
    const filteredPayments = await this.query(queryConstraints)
    
    // Apply sorting if provided
    if (sortConfig) {
      return filteredPayments.sort((a, b) => {
        const valueA = a[sortConfig.field];
        const valueB = b[sortConfig.field];
        
        // Compare primary sort field values
        let result = 0;
        
        // Handle different data types appropriately
        if (typeof valueA === 'string' && typeof valueB === 'string') {
          result = sortConfig.direction === 'asc' 
            ? valueA.localeCompare(valueB)
            : valueB.localeCompare(valueA);
        } else {
          // For numeric values or dates
          if (valueA! < valueB!) result = sortConfig.direction === 'asc' ? -1 : 1;
          if (valueA! > valueB!) result = sortConfig.direction === 'asc' ? 1 : -1;
        }
        
        // If primary values are equal, use target month as secondary sort
        if (result === 0 && a.targetMonth && b.targetMonth) {
          return b.targetMonth.localeCompare(a.targetMonth);
        }
        
        return result;
      });
    }
    
    // If no sorting specified, default to sorting by targetMonth
    return filteredPayments.sort((a, b) => {
      // Primary sort by target month (ascending)
      if (a.targetMonth && b.targetMonth) {
        const monthComparison = b.targetMonth.localeCompare(a.targetMonth);
        if (monthComparison !== 0) {
          return monthComparison;
        }
      } else if (a.targetMonth) {
        return -1; // Items with target month come first
      } else if (b.targetMonth) {
        return 1;
      }
      
      // Secondary sort by received date (newest first)
      return new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime();
    });
  }

  async findBySplitFromId(originalPaymentId: string): Promise<BankPayment[]> {
    return this.query([
      {
        field: "isSplitFromId",
        operator: "==",
        value: originalPaymentId
      },
      {
        field: "deleted",
        operator: "==",
        value: false
      }
    ]);
  }

  async getPaymentsByMonth(month: string): Promise<BankPayment[]> {
    return this.query([
      { field: "targetMonth", operator: "==", value: month },
      { field: "deleted", operator: "==", value: false }
    ]);
  }

  /**
   * Retrieves all child payments for a given parent payment ID
   */
  async getChildPayments(parentId: string): Promise<BankPayment[]> {
    const constraints = [
      { field: "isSplitFromId", operator: "==", value: parentId },
      { field: "deleted", operator: "==", value: false }
    ] satisfies QueryConstraint[];
    
    return this.query(constraints);
  }
}
// define a type PaymentQueryParams which is a subset of Bank Payment where the explicitly mentioned fields are omited and the rest of fields are optional
export type BankPaymentsFilterParams = Partial<Omit<BankPayment, "id" | "createdAt" | "updatedAt" | "deleted">>;

