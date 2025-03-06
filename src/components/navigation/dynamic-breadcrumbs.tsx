"use client"

import { usePathname } from "next/navigation"
import { useProject } from "@/hooks/use-projects"
import { Breadcrumbs } from "./breadcrumbs"
import { getBreadcrumbItems } from "@/config/navigation"

export function DynamicBreadcrumbs() {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)
  
  const projectId = segments[0] === 'projects' ? segments[1] : undefined
  const { data: project, isLoading } = useProject(projectId ?? '')

  console.log({
    pathname,
    segments,
    projectId,
    project,
    isLoading
  })

  const items = getBreadcrumbItems(pathname)

  // Update project title if available
  if (projectId && project) {
    const dynamicItem = items.find(item => item.dynamic)
    if (dynamicItem) {
      dynamicItem.title = project.name
      console.log('Updated breadcrumb:', items)
    }
  }

  return <Breadcrumbs items={items} />
} 