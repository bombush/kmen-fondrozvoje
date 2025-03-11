/**
 * Payment matrix page
 * Shows payments in a user/month matrix
 */
"use client"

import React, { useState } from "react"
import { toast } from "sonner"
import { User } from "@/types"
import { cn, formatMoney } from "@/lib/utils"

// Mock data for the payment matrix
type MatrixMonth = {
  month: string // Format: YYYY-MM
  totalIncome: number
  creditsPerUser: number
  userCredits: Record<string, number>
}

type PaymentMatrixData = {
  months: MatrixMonth[]
  users: User[]
}

// Mock data
const mockUsers: User[] = [
  {
    id: "user-001",
    name: "User1",
    email: "user1@example.com",
    avatar: "https://i.pravatar.cc/150?img=1",
    role: "user",
    //balance: 100,
    specificSymbol: "US001",
    variableSymbol: "123456",
    constantSymbol: "001",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z"
  },
  {
    id: "user-002",
    name: "User2",
    email: "user2@example.com",
    avatar: "https://i.pravatar.cc/150?img=2",
    role: "user",
    //balance: 200,
    specificSymbol: "US002",
    variableSymbol: "234567",
    constantSymbol: "002",
    isActive: true,
    createdAt: "2024-01-02T00:00:00Z",
    updatedAt: "2024-01-02T00:00:00Z"
  },
  {
    id: "user-003",
    name: "User3",
    email: "user3@example.com",
    avatar: "https://i.pravatar.cc/150?img=3",
    role: "user",
    //balance: 300,
    specificSymbol: "US003",
    variableSymbol: "345678",
    constantSymbol: "003",
    isActive: true,
    createdAt: "2024-01-03T00:00:00Z",
    updatedAt: "2024-01-03T00:00:00Z"
  },
  {
    id: "user-004",
    name: "User4",
    email: "user4@example.com",
    avatar: "https://i.pravatar.cc/150?img=4",
    role: "user",
    //balance: 400,
    specificSymbol: "US004",
    variableSymbol: "456789",
    constantSymbol: "004",
    isActive: true,
    createdAt: "2024-01-04T00:00:00Z",
    updatedAt: "2024-01-04T00:00:00Z"
  },
  {
    id: "user-005",
    name: "User5",
    email: "user5@example.com",
    avatar: "https://i.pravatar.cc/150?img=5",
    role: "user",
    //balance: 500,
    specificSymbol: "US005",
    variableSymbol: "567890",
    constantSymbol: "005",
    isActive: true,
    createdAt: "2024-01-05T00:00:00Z",
    updatedAt: "2024-01-05T00:00:00Z"
  },
  {
    id: "user-006",
    name: "User6",
    email: "user6@example.com",
    avatar: "https://i.pravatar.cc/150?img=6",
    role: "user",
    //balance: 600,
    specificSymbol: "US006",
    variableSymbol: "678901",
    constantSymbol: "006",
    isActive: true,
    createdAt: "2024-01-06T00:00:00Z",
    updatedAt: "2024-01-06T00:00:00Z"
  },
  {
    id: "user-007",
    name: "User7",
    email: "user7@example.com",
    avatar: "https://i.pravatar.cc/150?img=7",
    role: "user",
    //balance: 700,
    specificSymbol: "US007",
    variableSymbol: "789012",
    constantSymbol: "007",
    isActive: true,
    createdAt: "2024-01-07T00:00:00Z",
    updatedAt: "2024-01-07T00:00:00Z"
  },
  {
    id: "user-008",
    name: "User8",
    email: "user8@example.com",
    avatar: "https://i.pravatar.cc/150?img=8",
    role: "user",
    //balance: 800,
    specificSymbol: "US008",
    variableSymbol: "890123",
    constantSymbol: "008",
    isActive: true,
    createdAt: "2024-01-08T00:00:00Z",
    updatedAt: "2024-01-08T00:00:00Z"
  },
  {
    id: "user-009",
    name: "User9",
    email: "user9@example.com",
    avatar: "https://i.pravatar.cc/150?img=9",
    role: "user",
    //balance: 900,
    specificSymbol: "US009",
    variableSymbol: "901234",
    constantSymbol: "009",
    isActive: true,
    createdAt: "2024-01-09T00:00:00Z",
    updatedAt: "2024-01-09T00:00:00Z"
  },
  {
    id: "user-010",
    name: "User10",
    email: "user10@example.com",
    avatar: "https://i.pravatar.cc/150?img=10",
    role: "user",
    //balance: 1000,
    specificSymbol: "US010",
    variableSymbol: "012345",
    constantSymbol: "010",
    isActive: true,
    createdAt: "2024-01-10T00:00:00Z",
    updatedAt: "2024-01-10T00:00:00Z"
  }
]

const mockMatrixData: MatrixMonth[] = [
  {
    month: "2025-02",
    totalIncome: 3600,
    creditsPerUser: 300,
    userCredits: {
      "user-001": 300,
      "user-002": 300,
      "user-003": 300,
      "user-004": 300,
      "user-005": 300,
      "user-006": 300,
      "user-007": 300,
      "user-008": 300,
      "user-009": 300,
      "user-010": 300,
      "user-011": 300,
      "user-012": 300
    }
  },
  {
    month: "2025-03",
    totalIncome: 2400,
    creditsPerUser: 300,
    userCredits: {
      "user-001": 300,
      "user-002": 0,
      "user-003": 300,
      "user-004": 0,
      "user-005": 300,
      "user-006": 0,
      "user-007": 300,
      "user-008": 0,
      "user-009": 300,
      "user-010": 0,
      "user-011": 300,
      "user-012": 0
    }
  },
  {
    month: "2025-04",
    totalIncome: 4800,
    creditsPerUser: 400,
    userCredits: {
      "user-001": 400,
      "user-002": 400,
      "user-003": 400,
      "user-004": 400,
      "user-005": 400,
      "user-006": 400,
      "user-007": 400,
      "user-008": 400,
      "user-009": 400,
      "user-010": 400,
      "user-011": 400,
      "user-012": 400
    }
  }
]

export default function PaymentMatrixPage() {
  const [matrixData, setMatrixData] = useState<PaymentMatrixData>({
    months: mockMatrixData,
    users: mockUsers
  })

  // Function to handle cell click (for future interaction)
  const handleCellClick = (month: string, userId: string, currentValue: number) => {
    toast.info(`Cell clicked: ${month}, User ID: ${userId}, Value: ${currentValue}`, {
      description: "Editing functionality would be implemented here"
    })
  }

  // Function to format month for display
  const formatMonth = (month: string) => {
    return month // Could enhance with localization if needed
  }

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold tracking-tight">Payment Matrix</h1>
      <p className="text-muted-foreground">
        Credit distribution matrix showing how income is distributed among users by month.
      </p>

      <div className="rounded-md border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-b-2 border-b-border">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Month</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Total income</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Credits per user</th>
                {matrixData.users.map(user => (
                  <th key={user.id} className="px-4 py-3 text-left font-medium text-muted-foreground">
                    {user.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrixData.months.map(month => (
                <tr key={month.month} className="border-b border-b-muted/20">
                  <td className="px-4 py-3">{formatMonth(month.month)}</td>
                  <td className="px-4 py-3">
                    <span className="text-white-600 dark:text-black-400">
                      {formatMoney(month.totalIncome)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-blue-600 dark:text-blue-400">
                      {formatMoney(month.creditsPerUser)}
                    </span>
                  </td>
                  {matrixData.users.map(user => (
                    <td
                      key={`${month.month}-${user.id}`}
                      className={cn(
                        "px-4 py-3 cursor-pointer hover:bg-muted/50",
                        month.userCredits[user.id] ? "" : "text-muted-foreground"
                      )}
                      onClick={() => handleCellClick(month.month, user.id, month.userCredits[user.id] || 0)}
                    >
                      {month.userCredits[user.id] ? (
                        <span className="text-green-600 dark:text-green-400">
                          {formatMoney(month.userCredits[user.id])}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-sm text-muted-foreground">
        <p>Click on any user credit cell to edit.</p>
        <p>Green values show credit allocations, empty cells are shown in gray.</p>
      </div>
    </div>
  )
}