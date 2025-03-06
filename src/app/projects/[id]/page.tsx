/**
 * Project details page
 * Shows project info and allows editing
 */
"use client"

import { useState } from "react"
import { Project } from "@/types"

export default function ProjectPage({ params }: { params: { id: string } }) {
  const [isEditing, setIsEditing] = useState(false)

  return (
    <div>
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold">Project Details</h1>
        <button onClick={() => setIsEditing(!isEditing)}>
          {isEditing ? "Save" : "Edit"}
        </button>
      </div>

      {/* Project details will go here */}
    </div>
  )
} 