# Fond rozvoje

## Overview
An app that allows users to create and fund projects in a manner similar to Kickstarter.
The app should be mobile-first and responsive.

## Core functionalities
- User authentication (password+email and Google)
- Project management (create, edit, delete)
- Funding
- User management (create, edit, delete)

## Funding
### Currency
Currency used in the app is called CREDITS
Users are awarded CREDITS based on a mechanism which will be described later.

### Project management and funding
- User can create a project and set funding goal (in CREDITS) and other parameters
- User can fund a project
- User can see all projects and choose to fund one
- User can see all projects they have funded
- User can see and manage all projects they have created


## Documentation

### Basic structure of the project

kmen-fondrozvoje/
├── public/                     # Static assets (images, fonts, etc.)
│   ├── images/
│   └── favicon.ico
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── layout.tsx          # Main layout component
│   │   ├── page.tsx            # Projects listing page (now the homepage)
│   │   ├── projects/           # Projects related pages
│   │   │   ├── page.tsx        # Projects listing page (for /projects route)
│   │   │   ├── [id]/           # Dynamic project routes
│   │   │   │   └── page.tsx    # Individual project page
│   │   │   └── create/         # Create project page
│   │   │       └── page.tsx    # Create project form
│   │   ├── profile/            # User profile pages
│   │   │   └── page.tsx        # User profile dashboard
│   │   ├── user-management/     # User management pages
│   │   │   ├── page.tsx        # User management dashboard
│   │   │   ├── create/         # Create user page
│   │   │   │   └── page.tsx    # Create user form
│   │   │   ├── [id]/           # Dynamic user routes
│   │   │   │   └── page.tsx    # Individual user details page
│   │   │   └── edit/           # Edit user page
│   │   │       └── page.tsx    # Edit user form
│   ├── components/             # Reusable components
│   │   ├── ui/                 # UI components (buttons, modals, etc.)
│   │   ├── projects/           # Project-specific components
│   │   │   ├── ProjectCard.tsx  # Project card component
│   │   │   ├── ProjectGrid.tsx  # Grid of project cards
│   │   │   └── ProjectHeader.tsx # Project page header
│   │   ├── users/              # User-specific components
│   │   │   ├── UserCard.tsx     # User card component
│   │   │   └── UserList.tsx     # List of users component
│   │   └── layout/             # Layout components (Navbar, Footer)
│   │       ├── Navbar.tsx
│   │       └── Footer.tsx
│   ├── styles/                 # Global styles
│   │   └── globals.css         # Global CSS file
│   ├── types/                  # TypeScript type definitions
│   │   └── index.ts            # Type definitions for the project
│   └── lib/                    # Utility functions and mock data
│       ├── mock-data/          # Mock JSON data
│       │   ├── projects.json    # Mock project data
│       │   └── users.json       # Mock user data
│       └── utils/              # Utility functions (e.g., filtering)
│           └── projectFilters.ts # Filtering logic for projects
├── .gitignore                  # Git ignore file
├── package.json                # Project dependencies and scripts
├── tailwind.config.js          # Tailwind CSS configuration
└── postcss.config.js           # PostCSS configuration





