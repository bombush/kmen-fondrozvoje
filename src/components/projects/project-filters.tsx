import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

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
    <div className="flex flex-col gap-2 sm:flex-row">
      <Input
        placeholder="Search projects..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="sm:w-[200px]"
      />
      <div className="flex items-center space-x-1">
        <Button
          variant={statusFilter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => onStatusFilterChange("all")}
        >
          All
        </Button>
        <Button
          variant={statusFilter === "active" ? "default" : "outline"}
          size="sm"
          onClick={() => onStatusFilterChange("active")}
        >
          Active
        </Button>
        <Button
          variant={statusFilter === "completed" ? "default" : "outline"}
          size="sm"
          onClick={() => onStatusFilterChange("completed")}
        >
          Completed
        </Button>
      </div>
    </div>
  )
} 