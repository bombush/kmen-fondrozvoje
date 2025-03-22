import { formatDate } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Edit } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type PledgeWithUser = {
  id: string
  userId: string
  projectId: string
  amount: number
  description: string
  createdAt: string
  updatedAt: string
  deleted?: boolean
  locked?: boolean
  userName: string
  userEmail: string
}

interface PledgeListProps {
  pledges: PledgeWithUser[]
  isLoading: boolean
  currentUserId?: string
  isAdmin?: boolean
  onEditPledge?: (pledge: PledgeWithUser) => void
}

export function PledgeList({ 
  pledges, 
  isLoading, 
  currentUserId,
  isAdmin,
  onEditPledge 
}: PledgeListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    )
  }

  if (pledges.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No pledges have been made to this project yet.
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>User</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Notes</TableHead>
          {(isAdmin || currentUserId) && <TableHead className="w-16">Actions</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {pledges.map((pledge) => (
          <TableRow key={pledge.id}>
            <TableCell className="font-medium">
              <div>
                <div>{pledge.userName}</div>
                <div className="text-xs text-muted-foreground">{pledge.userEmail}</div>
              </div>
            </TableCell>
            <TableCell>
              <span className="font-semibold">{pledge.amount}</span> CREDITS
            </TableCell>
            <TableCell>{formatDate(pledge.createdAt)}</TableCell>
            <TableCell>
              {pledge.description ? pledge.description : <span className="text-muted-foreground italic">No description</span>}
            </TableCell>
            {(isAdmin || currentUserId === pledge.userId) && (
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEditPledge?.(pledge)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
} 