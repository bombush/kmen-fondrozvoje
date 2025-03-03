"use client"

import { BankStatement } from "@/types"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatDate } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye } from "lucide-react"

interface BankStatementListProps {
  statements: BankStatement[]
  onViewStatement: (statement: BankStatement) => void
}

export function BankStatementList({ statements, onViewStatement }: BankStatementListProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Month</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Processed</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {statements.map((statement) => (
          <TableRow key={statement.id}>
            <TableCell>{statement.month}</TableCell>
            <TableCell>
              <Badge variant={statement.status === 'processed' ? 'success' : 'warning'}>
                {statement.status}
              </Badge>
            </TableCell>
            <TableCell>{formatDate(statement.processedAt)}</TableCell>
            <TableCell>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onViewStatement(statement)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
} 