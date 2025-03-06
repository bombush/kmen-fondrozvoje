"use client"

import { usePathname } from "next/navigation"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/navigation/breadcrumb"
import React from "react"
import { getBreadcrumbItems, NavItem } from "@/config/navigation"

/**
 * Breadcrumbs navigation component
 * Shows the current location in the app hierarchy
 * 
 * Features:
 * - Automatically generates breadcrumbs based on current path
 * - Always starts with Home
 * - Uses centralized navigation config
 * - Accessible navigation with proper ARIA attributes
 */

interface BreadcrumbsProps {
  items: NavItem[]
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  const pathname = usePathname()
  const breadcrumbItems = getBreadcrumbItems(pathname)

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbItems.map((item, index) => {
          const isLast = index === breadcrumbItems.length - 1

          return (
            <React.Fragment key={item.href}>
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{item.title}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={item.href}>{item.title}</BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </React.Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
} 