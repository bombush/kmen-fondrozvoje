"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { navigationConfig } from "@/config/navigation"

export function MainNav() {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-2">
      {navigationConfig.map((section, index) => (
        <div key={section.title ?? index} className="flex flex-col gap-1">
          {section.title && (
            <div className="text-xs font-medium text-muted-foreground px-2">
              {section.title}
            </div>
          )}
          {section.items.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-accent hover:text-accent-foreground",
                  pathname === item.href && "bg-accent text-accent-foreground"
                )}
              >
                {Icon && <Icon className="w-4 h-4" />}
                {item.title}
              </Link>
            )}
          )}
        </div>
      ))}
    </nav>
  )
} 