import { Checkbox } from "@/components/ui/checkbox"

// Inside your form component
const ProjectForm = ({ project, onSubmit, isLoading }) => {
  // Existing form code...
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Existing form fields... */}
      
      {/* Add these new fields - only show for existing projects */}
      {project?.id && (
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
        </div>
      )}
      
      {/* Submit button */}
      <Button type="submit" disabled={isLoading} className="mt-6">
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          "Save Project"
        )}
      </Button>
    </form>
  )
} 