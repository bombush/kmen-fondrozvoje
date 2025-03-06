/**
 * Payment list page
 * Shows all payments with search and filters
 */
"use client"

import { useState } from "react"
import { BankPayment } from "@/types"

export default function PaymentsPage() {
  const [search, setSearch] = useState("")
  const [monthFilter, setMonthFilter] = useState<string>("")

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Payments</h1>

      <div className="flex gap-4">
        <input 
          type="search"
          placeholder="Search payments..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <input 
          type="month"
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
        />
      </div>

      {/* Payment list will go here */}
    </div>
  )
} 