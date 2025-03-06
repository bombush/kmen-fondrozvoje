import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"

interface ProjectFiltersProps {
  search: string
  onSearchChange: (search: string) => void
  statusFilter: "all" | "active" | "completed"
  onStatusFilterChange: (status: "all" | "active" | "completed") => void
}

export function ProjectFilters({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange
}: ProjectFiltersProps) {
  return (
    <div className="flex gap-4">
      <Input 
        type="search"
        placeholder="Search projects..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
      />
      <Select 
        value={statusFilter}
        onValueChange={onStatusFilterChange}
      >
        <option value="all">All</option>
        <option value="active">Active</option>
        <option value="completed">Completed</option>
      </Select>
    </div>
  )
} 