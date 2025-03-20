"use client"

import { usePathname } from "next/navigation"
import { useProject } from "@/hooks/use-projects"
import { Breadcrumbs } from "./breadcrumbs"
import { getBreadcrumbItems } from "@/config/navigation"
import { Project } from "@/types"
import { useState } from "react"

export function DynamicBreadcrumbs() {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)
  

  const projectId = false;
  const project = false;
  //@TODO: check if in projects route? Check if projectId in segments?
  //@TODO: infinite loop of rerendering here cycle
  /*const projectId = segments[0] === 'projects' ? segments[1] : undefined
  let project: Project | null | undefined = null
    const { data, isLoading } = useProject(projectId ?? '')
    project = data

    /*  
    console.log({
      pathname,
      segments,
      projectId,
      project,
      isLoading
    })
    */
  

  const [items, setItems] = useState(getBreadcrumbItems(pathname))

  

  // Update project title if available
  if (projectId && project) {
    const dynamicItemIndex = items.findIndex(item => item.dynamic)
    if (dynamicItemIndex !== -1) {
      const updatedDynamicItem = {
        ...items[dynamicItemIndex],
        title: project.name,
      }

      // Create a new array with the modified item
      const updatedItems = items.map((item, index) => 
        index === dynamicItemIndex ? updatedDynamicItem : item
      )

      // Update the state with the new array
      setItems(updatedItems)

      console.log('Updated breadcrumb:', updatedItems)
    }
  }

  return <Breadcrumbs items={items} />
} 