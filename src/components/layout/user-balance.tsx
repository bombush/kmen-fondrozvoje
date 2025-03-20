"use client"

import { useAuth } from "@/contexts/auth-context"
import { useUserBalance } from "@/hooks/use-user-balance"
import { formatMoney } from "@/lib/utils"
import { Coins } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

export function UserBalance() {
  const { appUser } = useAuth()
  const { data: balance, isLoading } = useUserBalance(appUser?.id)
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-accent transition-colors cursor-default">
          <Coins className="h-4 w-4 text-yellow-500" />
          {isLoading ? (
            <Skeleton className="h-4 w-14" />
          ) : (
            <span className="text-sm font-medium">{balance} CREDITS</span>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>Your current balance</p>
      </TooltipContent>
    </Tooltip>
  )
} 