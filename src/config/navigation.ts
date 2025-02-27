import { 
  HomeIcon, 
  LayoutDashboardIcon, 
  FolderIcon, 
  UsersIcon,
  type LucideIcon 
} from "lucide-react"

export interface NavItem {
  title: string
  href: string
  icon?: LucideIcon
  description?: string
  disabled?: boolean
}

export interface NavSection {
  title?: string
  items: NavItem[]
}

export const navigationConfig: NavSection[] = [
  {
    items: [
      {
        title: "Home",
        href: "/",
        icon: HomeIcon,
        description: "Return to homepage",
      },
      {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboardIcon,
        description: "View your dashboard",
      },
    ],
  },
  {
    title: "Management",
    items: [
      {
        title: "Projects",
        href: "/projects",
        icon: FolderIcon,
        description: "Manage your projects",
      },
      {
        title: "Users",
        href: "/users",
        icon: UsersIcon,
        description: "Manage users",
      },
    ],
  },
]

// Helper function to get nav item by path
export function getNavItemByPath(path: string): NavItem | undefined {
  return navigationConfig
    .flatMap(section => section.items)
    .find(item => item.href === path)
}

// Helper function to get breadcrumb items
export function getBreadcrumbItems(path: string): NavItem[] {
  const segments = path.split('/').filter(Boolean)
  const items: NavItem[] = []
  
  // Always include home
  items.push(getNavItemByPath('/') as NavItem)
  
  // Build up the path segments and find matching nav items
  let currentPath = ''
  for (const segment of segments) {
    currentPath += `/${segment}`
    const item = getNavItemByPath(currentPath)
    if (item) {
      items.push(item)
    }
  }
  
  return items
} 