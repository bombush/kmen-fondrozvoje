

# Fond rozvoje

## Overview
An app that allows users to create and fund projects in a manner similar to Kickstarter.
The app should be mobile-first and responsive.

## Design guidelines
- Support for dark mode including a toggle button

## Core functionalities
- User authentication (password+email and Google)
- Project management (create, edit, delete)
- Pledging to a project
- User management (create, edit, delete)
- superuser functionality and permissions management

## Pledging
### Currency
Currency used in the app is called CREDITS
Users are awarded CREDITS based on a mechanism which will be described later.

### Project management and funding
- User can create a project and set funding goal (in CREDITS) and other parameters
- User can pledge to a project
- User can see all projects and choose to pledge to one
- User can see all projects they have pledged to
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
│   │   ├── page.tsx            # User dashboard
│   │   ├── projects/           # Projects related pages
│   │   │   ├── page.tsx        # Projects listing page (for /projects route)
│   │   │   ├── [id]/           # Dynamic project routes
│   │   │   └── new/            # Create project page
│   │   ├── users/              # User management pages
│   │   │   ├── page.tsx        # User management dashboard
│   │   │   ├── create/         # Create user page
│   │   │   ├── [id]/           # Dynamic user routes
│   ├── components/             # Reusable components
│   │   ├── ui/                 # UI components (buttons, modals, etc.)
│   │   ├── projects/           # Project-specific components
│   │   ├── users/              # User-specific components
│   │   └── layout/             # Layout components
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


### Layout


React pseudocode sample:
```
<Layout>
  <Navbar>
    <SidebarTrigger/> # button to open/close LeftSidebar
    <Logo />
    <Breadcrumbs />
    <BackButton />
    <ThemeToggle />
  </Navbar>
  <LeftSidebar>
    # links: projects, users, settings
  </LeftSidebar>
  <MainContent />
  <Footer />
</Layout>
```



### Types

#### Project
Projects that can be funded and managed by users

#### User
Users of the app

#### Pledge
Single pledge in CREDITS by a user to a project

#### HistoryAction
Actions performed by users in the app


### Functionality

### HistoryAction 
For every action performed by a user, a `HistoryAction` record is created.
`HistoryAction` must contain enough information to be able to reverse the action.
Data relevant to the action is stored in a subobject called `data`.

`Project` can be created by a user
`Project` can be edited by owner user
`Project` can be deleted by owner user

`User` can create another user

CREDITS can be awarded to a user by another user

`User` has a balance of CREDITS
`User` can pledge to a project creating a `Pledge`


#### Projects
Project has a goal in CREDITS.
Users submit pledges to a project.
Project has flags that indicate whether money has been transferred to the project owner
and flag which indicate whether the project was realized and a flag that indicates whether the project has been added to majetekKmene.

#### Pledging
`Pledge` can be deleted or edited by the creator of the pledge
During creation of a pledge, the pledged amount of CREDITS is deducted from the creator's balance
Until `Pledge` is locked, credits can be transferred between pledges by the creator in both directions
A locked `Pledge` cannot be edited or deleted
Sum of all pledges to a project must not exceed the project's goal.

__ Completion of a project __
When the sum of all pledges to a project is equal to the project's goal, the project is considered fully funded, the pledges are locked and a "completed" flag is set to true.

#### Bank statements and awarding of credits
Every month a PROJECT BANK STATEMENT from the PROJECT BANK ACCOUNT is downloaded and processed.

Payments received by the PROJECT BANK ACCOUNT are assigned to the month they were received.

##### Splitting payments
Payments can be split by a user over previous months. The virtual payments thus created are marked with the `isSplitFromId` field indicating the original payment id. Target month should be updated to the month of the new payment.
The amount in the original payment must be updated so that the sum of the original payment and all its virtual children equals the original payment amount.
The rationale for this is that a user can fail to pay in a month and then pay for retroactively in the following months.

Whenever a month ends, income to the payments from users assigned to a month is summed up, the sum is converted to CREDITS and the CREDITS are uniformly distributed among all users who contributed during the month in question. 
If ANY change in payments in previous months is detected, credits recalculation is triggered.

User balance thus calculated can be negative.
`BankPayment` should be the single source of truth for all automatically awarded CREDITS.

It is possible to manually award CREDITS to a user.

- write about projects :)



### Pages

#### Home
Empty for now.

#### Projects
A list of projects with a search bar and a filter by status.

#### Project details
Contains detailed information about a project and can be switched to an edit mode.

#### Payment list
A list of payments with a search bar and a filter by status.

#### Payment matrix
A matrix of payments with users on the x-axis and months on the y-axis.

#### Users
A user management page

#### Profile
A profile page for a user

