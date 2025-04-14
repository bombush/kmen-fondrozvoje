"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2 } from "lucide-react"
import { Project } from "@/types"

interface ProjectFormProps {
  project: Partial<Project>
  onSubmit: (data: any) => void
  isLoading: boolean
  mode?: 'create' | 'edit'
}

export function ProjectForm({ project, onSubmit, isLoading, mode = 'edit' }: ProjectFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    goal: 0,
    url: '',
    ownerId: '',
    fundsSentToOwner: false,
    bought: false,
    addedToAssetList: false,
    locked: false,
    closed: false
  })

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name || '',
        description: project.description || '',
        goal: project.goal || 0,
        url: project.url || '',
        ownerId: project.ownerId || '',
        fundsSentToOwner: project.fundsSentToOwner || false,
        bought: project.bought || false,
        addedToAssetList: project.addedToAssetList || false,
        locked: project.locked || false,
        closed: project.closed || false
      })
    }
  }, [project])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'goal' ? parseFloat(value) : value
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Project Name</Label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
        />
      </div>
      
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={5}
          required
        />
      </div>
      
      <div>
        <Label htmlFor="url">Project URL</Label>
        <Input
          id="url"
          name="url"
          type="url"
          value={formData.url}
          onChange={handleChange}
          placeholder="https://example.com"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Optional link to product or more information
        </p>
      </div>
      
      <div>
        <Label htmlFor="goal">Funding Goal</Label>
        <Input
          id="goal"
          name="goal"
          type="number"
          min="0"
          step="0.01"
          value={formData.goal}
          onChange={handleChange}
          required
        />
        <p className="text-xs text-muted-foreground mt-1">
          The target amount needed for this project
        </p>
      </div>
      
      {/* Administrative fields - only show for existing projects in edit mode */}
      {mode === 'edit' && project.id && (
        <div className="space-y-4 border rounded-md p-4 mt-6">
          <h3 className="font-medium">Administrative Status</h3>
          
          <div className="flex items-start space-x-2">
            <Checkbox 
              id="fundsSentToOwner" 
              checked={formData.fundsSentToOwner}
              onCheckedChange={(checked) => 
                setFormData({...formData, fundsSentToOwner: checked === true})
              }
            />
            <div className="grid gap-1.5 leading-none">
              <label
                htmlFor="fundsSentToOwner"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Funds Sent To Owner
              </label>
              <p className="text-sm text-muted-foreground">
                Mark when funds have been transferred to the project owner
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-2">
            <Checkbox 
              id="bought" 
              checked={formData.bought}
              onCheckedChange={(checked) => 
                setFormData({...formData, bought: checked === true})
              }
            />
            <div className="grid gap-1.5 leading-none">
              <label
                htmlFor="bought"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Item Purchased
              </label>
              <p className="text-sm text-muted-foreground">
                Mark when the project item has been purchased
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-2">
            <Checkbox 
              id="addedToAssetList" 
              checked={formData.addedToAssetList}
              onCheckedChange={(checked) => 
                setFormData({...formData, addedToAssetList: checked === true})
              }
            />
            <div className="grid gap-1.5 leading-none">
              <label
                htmlFor="addedToAssetList"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Added to Asset List
              </label>
              <p className="text-sm text-muted-foreground">
                Mark when the item has been added to the organization's asset list
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-2">
            <Checkbox 
              id="closed" 
              checked={formData.closed}
              onCheckedChange={(checked) => 
                setFormData({...formData, closed: checked === true})
              }
            />
            <div className="grid gap-1.5 leading-none">
              <label
                htmlFor="closed"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Project Completed
              </label>
              <p className="text-sm text-muted-foreground">
                Mark when the project has been fully completed
              </p>
            </div>
          </div>
        </div>
      )}
      
      <Button type="submit" disabled={isLoading} className="mt-6">
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {mode === 'create' ? 'Creating...' : 'Saving...'}
          </>
        ) : (
          mode === 'create' ? 'Create Project' : 'Save Project'
        )}
      </Button>
    </form>
  )
} 