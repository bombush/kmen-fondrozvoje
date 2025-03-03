"use client"

import * as React from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface TeamSwitcherProps {
  teams: {
    name: string
    plan: string
  }[]
}

export function TeamSwitcher({ teams }: TeamSwitcherProps) {
  return (
    <Select defaultValue={teams[0].name}>
      <SelectTrigger className="h-8 w-full justify-between px-4">
        <SelectValue placeholder="Select team" />
      </SelectTrigger>
      <SelectContent>
        {teams.map((team) => (
          <SelectItem key={team.name} value={team.name}>
            <div className="flex items-center gap-2">
              <span>{team.name}</span>
              <span className="text-xs text-muted-foreground">({team.plan})</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
} 