import { 
  Home,
  FolderGit2,
  Receipt,
  Table,
  Users,
  User,
  LayoutDashboard,
  CreditCard,
  Settings
} from "lucide-react"

export interface NavItem {
  title: string
  href: string
  icon?: any
  description?: string
  disabled?: boolean
  dynamic?: boolean
}

export interface NavSection {
  title?: string
  items: NavItem[]
}

export const navigationConfig: NavSection[] = [
  {
    title: "Dashboard",
    items: [
      {
        title: "Home",
        href: "/",
        icon: Home
      },
      {
        title: "Overview",
        href: "/dashboard",
        icon: LayoutDashboard
      }
    ]
  },
  {
    title: "Projects",
    items: [
      {
        title: "All Projects",
        href: "/projects",
        icon: FolderGit2
      }
    ]
  },
  {
    title: "Finances",
    items: [
      {
        title: "Payments",
        href: "/payments",
        icon: Receipt
      },
      {
        title: "Payment Matrix",
        href: "/payments/matrix",
        icon: Table
      },
      {
        title: "Credits",
        href: "/credits",
        icon: CreditCard
      }
    ]
  },
  {
    title: "Management",
    items: [
      {
        title: "Users",
        href: "/users",
        icon: Users
      },
      {
        title: "Profile",
        href: "/profile",
        icon: User
      },
      {
        title: "Settings",
        href: "/settings",
        icon: Settings
      }
    ]
  }
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
  
  let currentPath = ''
  for (const segment of segments) {
    currentPath += `/${segment}`
    
    if (segment === 'projects') {
      items.push({
        title: 'Projects',
        href: '/projects',
        icon: FolderGit2
      })
      
      // If next segment exists, it's a project detail page
      const nextSegment = segments[segments.indexOf(segment) + 1]
      if (nextSegment) {
        items.push({
          title: `Loading...`, // Placeholder until project loads
          href: `/projects/${nextSegment}`,
          dynamic: true
        })
      }
      break // Stop processing further segments for project routes
    } else {
      const item = getNavItemByPath(currentPath)
      if (item) {
        items.push(item)
      }
    }
  }
  
  return items
} 