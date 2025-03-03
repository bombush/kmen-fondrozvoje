"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { navigationConfig } from "@/config/navigation"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useSidebar } from "@/components/layout/sidebar"

export function NavItems() {
  const pathname = usePathname()
  const sidebar = useSidebar()

  return (
    <div className="flex flex-col gap-4">
      {navigationConfig.map((section, index) => (
        <div key={section.title ?? index} className="flex flex-col gap-1">
          {section.title && (
            <h4 
              className={cn(
                "text-xs font-medium leading-4 text-muted-foreground px-2",
                sidebar.open || "hidden"
              )}
            >
              {section.title}
            </h4>
          )}
          <nav className="grid gap-1">
            {section.items.map((item) => {
              const Icon = item.icon
              return (
                <Tooltip key={item.href} delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                        pathname === item.href && "bg-accent text-accent-foreground",
                        sidebar.open || "justify-center"
                      )}
                    >
                      {Icon && <Icon className="h-4 w-4 shrink-0" />}
                      <span className={cn(
                        "ml-3",
                        sidebar.open || "hidden"
                      )}>
                        {item.title}
                      </span>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent 
                    side="right" 
                    className="flex items-center gap-4"
                    hidden={!sidebar.open}
                  >
                    {item.title}
                    {item.description && (
                      <span className="text-muted-foreground">
                        {item.description}
                      </span>
                    )}
                  </TooltipContent>
                </Tooltip>
              )
            })}
          </nav>
        </div>
      ))}
    </div>
  )
} 