import { 
  Home,
  FolderGit2,
  Receipt,
  Table,
  Users,
  User
} from "lucide-react"

export const navigation = [
  {
    title: "Home",
    href: "/",
    icon: Home
  },
  {
    title: "Projects",
    href: "/projects",
    icon: FolderGit2
  },
  {
    title: "Payments",
    items: [
      {
        title: "List",
        href: "/payments",
        icon: Receipt
      },
      {
        title: "Matrix",
        href: "/payments/matrix", 
        icon: Table
      }
    ]
  },
  {
    title: "Users",
    href: "/users",
    icon: Users
  },
  {
    title: "Profile",
    href: "/profile",
    icon: User
  }
]

export type NavigationItem = {
  title: string
  href?: string
  icon?: any
  items?: NavigationItem[]
}

// Helper function to get nav item by path
export function getNavItemByPath(path: string): NavigationItem | undefined {
  return navigation.find(item => item.href === path)
}

// Helper function to get breadcrumb items
export function getBreadcrumbItems(path: string): NavigationItem[] {
  const segments = path.split('/').filter(Boolean)
  const items: NavigationItem[] = []
  
  // Always include home
  items.push(getNavItemByPath('/') as NavigationItem)
  
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