# SkillsApp Admin Dashboard - Complete Documentation

## Table of Contents

1. [Overview](#overview)
2. [Why Admin Dashboard Exists](#why-admin-dashboard-exists)
3. [Features & Functions](#features--functions)
4. [Folder Structure](#folder-structure)
5. [Technology Stack](#technology-stack)
6. [UI/UX & Theme System](#uiux--theme-system)
7. [Backend Architecture](#backend-architecture)
8. [Key Code Snippets](#key-code-snippets)
9. [How to Use](#how-to-use)
10. [Development Setup](#development-setup)
11. [Progress Tracker](#progress-tracker)
12. [Future Modifications](#future-modifications)

---

## Overview

The **SkillsApp Admin Dashboard** is a separate Next.js 16 web application that provides a Content Management System (CMS) for the SkillsApp mobile app. It allows admins to manage:

- 📝 **Community Posts** - Create, edit, publish, and delete career-related content
- 🗂️ **Filters/Career Paths** - Manage the 6-level hierarchical career path system
- 📊 **Dashboard Analytics** - View stats on posts, filters, and engagement

**Production URL**: `http://localhost:3000` (during development)  
**Admin Route**: `/admin/*`

---

## Why Admin Dashboard Exists

### The Problem

The mobile SkillsApp follows an **admin-curated model** where only admins create posts. This ensures:
- High-quality, verified career information
- No spam or misinformation
- Consistent content standards

### The Solution

Instead of adding complex admin features to the mobile app, we created a dedicated **web-based CMS**:

| Approach | Mobile Admin | Web Dashboard ✅ |
|----------|--------------|------------------|
| Screen space | Limited | Full desktop |
| Data management | Difficult | Tables, filters, bulk actions |
| Content creation | Keyboard issues | Full WYSIWYG |
| Filter management | Complex hierarchy | Tree view, drag-drop |
| Multi-tasking | Single focus | Multiple tabs |

### Key Benefits

1. **Separation of Concerns** - Mobile app stays lightweight and user-focused
2. **Desktop Experience** - Large screens for data management
3. **Professional Tools** - Tables, search, filtering, bulk actions
4. **Secure** - Clerk authentication protects admin routes
5. **Same Database** - Convex syncs data in real-time with mobile app

---

## Features & Functions

### 1. Dashboard Home (`/admin`)

The main landing page showing:

```
┌─────────────────────────────────────────────────────────┐
│                    📊 DASHBOARD                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐    │
│  │ Total Posts  │ │ Draft Posts  │ │ Total Filters│    │
│  │     24       │ │     5        │ │     156      │    │
│  │ 19 published │ │ Pending      │ │ Categories   │    │
│  └──────────────┘ └──────────────┘ └──────────────┘    │
│                                                         │
│  Quick Actions:                                         │
│  [➕ Create New Post] [🗂️ Manage Filters] [📝 Posts]   │
│                                                         │
│  Recent Posts:          Recent Filters:                 │
│  • React Developer...   • Graduation                    │
│  • Navy Pilot Guide     • Government Jobs               │
│  • UPSC Preparation     • Defence Services              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Features:**
- ✅ Stats cards with loading states
- ✅ Quick action buttons
- ✅ Recent posts preview
- ✅ Recent filters preview

---

### 2. Filter Management (`/admin/filters`)

The heart of the CMS - manage the 6-level career path hierarchy:

```
┌───────────────────────────────────────────────────────────────────┐
│  🗂️ FILTERS                                                      │
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─── Tree View ────────┐  ┌─── Inspector ─────────────────────┐ │
│  │                      │  │                                   │ │
│  │ 📁 Graduation        │  │  Name: Indian Navy                │ │
│  │  └─ 📁 Govt Jobs     │  │  Type: subSector                  │ │
│  │     └─ 📁 Defence    │  │                                   │ │
│  │        └─ 📂 Navy ◀──│──│  Description:                     │ │
│  │           └─ 📄 Pilot │  │  Naval forces protecting...      │ │
│  │        └─ 📁 Army    │  │                                   │ │
│  │        └─ 📁 Air Frc │  │  Requirements:                    │ │
│  │                      │  │  Graduation in any stream...      │ │
│  │  📁 12th Standard    │  │                                   │ │
│  │  📁 10th Standard    │  │  Salary: ₹56,100 - ₹1,77,500     │ │
│  │                      │  │                                   │ │
│  │ Stats: 156 total     │  │  [✏️ Edit] [🔴 Deactivate]        │ │
│  └──────────────────────┘  └───────────────────────────────────┘ │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

**Features:**
- ✅ Interactive tree view with expand/collapse
- ✅ Color-coded filter types (purple=qualification, blue=category, etc.)
- ✅ Click to select and inspect
- ✅ Add child filter button on hover
- ✅ Inspector panel for viewing/editing details
- ✅ Toggle active/inactive status
- ✅ Search filters by name
- ✅ Stats footer (total, active, roles count)

**Filter Hierarchy Types:**
| Level | Type | Example | Color |
|-------|------|---------|-------|
| 1 | qualification | Graduation, 12th Std | Purple |
| 2 | category | Government Jobs, Private Jobs | Blue |
| 3 | sector | Defence, Banking, Railways | Cyan |
| 4 | subSector | Indian Navy, Indian Army | Teal |
| 5 | branch | Executive Branch, Technical | Emerald |
| 6 | role | Navy Pilot, SSC Officer | Amber |

---

### 3. Posts Management (`/admin/posts`)

View, search, filter, and manage all community posts:

```
┌───────────────────────────────────────────────────────────────────┐
│  📝 POSTS                                       [➕ Create Post]  │
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│  [🔍 Search posts...]  [Filter: All ▼]  (24 posts)               │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐   │
│  │ Content          │ Author │ ❤️ │ 💬 │ Status  │ Created  │   │
│  ├───────────────────────────────────────────────────────────┤   │
│  │ React Developer  │ admin  │ 45 │ 12 │ ●Publis │ Feb 1    │ 🗑️│
│  │ Roadmap 2026...  │        │    │    │         │          │   │
│  ├───────────────────────────────────────────────────────────┤   │
│  │ Navy Pilot Guide │ admin  │ 89 │ 23 │ ●Draft  │ Jan 30   │ 🗑️│
│  │ Life as a Navy...│        │    │    │         │          │   │
│  ├───────────────────────────────────────────────────────────┤   │
│  │ UPSC Prep Tips   │ admin  │ 120│ 56 │ ●Publis │ Jan 28   │ 🗑️│
│  └───────────────────────────────────────────────────────────┘   │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

**Features:**
- ✅ Table view with sorting
- ✅ Search by title, content, author
- ✅ Filter by status (All, Published, Draft)
- ✅ Like/comment counts
- ✅ Created date
- ✅ Delete with confirmation dialog
- ✅ Loading skeleton states

---

### 4. Create New Post (`/admin/posts/new`)

Full-featured post creation form:

```
┌───────────────────────────────────────────────────────────────────┐
│  ← Back              CREATE NEW POST        [Save Draft] [Publish]│
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│  📄 Title *                                                       │
│  ┌───────────────────────────────────────────────────────────┐   │
│  │ Enter post title...                                        │   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                   │
│  📝 Content *                                                     │
│  ┌───────────────────────────────────────────────────────────┐   │
│  │                                                            │   │
│  │ Write your post content here...                            │   │
│  │                                                            │   │
│  │                                                            │   │
│  │                                          (234 characters)  │   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                   │
│  🖼️ Image URL (optional)                                         │
│  ┌───────────────────────────────────────────────────────────┐   │
│  │ https://example.com/image.jpg                              │   │
│  └───────────────────────────────────────────────────────────┘   │
│  Preview: [Image preview box]                                     │
│                                                                   │
│  🗂️ Career Paths / Filters (optional)                            │
│  ┌───────────────────────────────────────────────────────────┐   │
│  │ [× React Developer] [× Frontend Development]               │   │
│  │ Select more filters...                                     │   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

**Features:**
- ✅ Title input (required)
- ✅ Content textarea with character count
- ✅ Image URL with live preview
- ✅ Filter/career path selector (multi-select)
- ✅ Save as Draft
- ✅ Publish directly
- ✅ Form validation
- ✅ Toast notifications

---

## Folder Structure

```
admin-dashboard/
├── app/                           # Next.js App Router
│   ├── globals.css                # Global styles (Tailwind + CSS variables)
│   ├── layout.tsx                 # Root layout (Clerk + Convex providers)
│   ├── page.tsx                   # Landing/login page
│   │
│   └── admin/                     # Protected admin routes
│       ├── layout.tsx             # Admin layout (Sidebar + Header)
│       ├── page.tsx               # Dashboard home
│       │
│       ├── filters/
│       │   └── page.tsx           # Filter tree management
│       │
│       └── posts/
│           ├── page.tsx           # Posts list
│           └── new/
│               └── page.tsx       # Create new post
│
├── components/
│   ├── admin/                     # Admin-specific components
│   │   ├── AddFilterModal.tsx     # Modal for creating filters
│   │   ├── ConfirmDialog.tsx      # Confirmation dialog
│   │   ├── FilterInspector.tsx    # Filter detail/edit panel
│   │   ├── FilterSelector.tsx     # Multi-select filter picker
│   │   ├── FilterTree.tsx         # Hierarchical tree view
│   │   ├── Header.tsx             # Top bar with breadcrumb + user
│   │   ├── Sidebar.tsx            # Left navigation sidebar
│   │   ├── StatsCard.tsx          # Dashboard stat card
│   │   ├── Toast.tsx              # Toast notification system
│   │   └── index.ts               # Barrel export
│   │
│   └── providers/
│       └── ConvexClientProvider.tsx  # Convex React provider
│
├── convex/                        # Convex backend (shared with mobile)
│   ├── _generated/                # Auto-generated types
│   ├── adminAuth.ts               # Admin authentication helpers
│   ├── adminFilters.ts            # Admin filter CRUD operations
│   ├── communityPosts.ts          # Post queries and mutations
│   ├── filter.ts                  # Public filter queries
│   ├── schema.ts                  # Database schema
│   ├── users.ts                   # User management
│   └── [other files...]           # Shared with mobile app
│
├── lib/
│   └── utils.ts                   # Utility functions (cn, etc.)
│
├── docs/
│   └── admin.md                   # This documentation file
│
├── middleware.ts                  # Clerk auth middleware
├── package.json                   # Dependencies
├── next.config.ts                 # Next.js configuration
├── tsconfig.json                  # TypeScript configuration
└── .env.local                     # Environment variables
```

---

## Technology Stack

### Frontend Framework
| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 16.1.6 | React framework with App Router |
| **React** | 19.2.3 | UI library |
| **TypeScript** | ^5 | Type safety |

### Styling
| Technology | Version | Purpose |
|------------|---------|---------|
| **Tailwind CSS** | ^4 | Utility-first CSS |
| **tw-animate-css** | ^1.4.0 | Tailwind animations |
| **clsx + tailwind-merge** | Latest | Class merging |
| **Geist Font** | Built-in | Typography |

### Backend & Auth
| Technology | Version | Purpose |
|------------|---------|---------|
| **Convex** | ^1.31.7 | Real-time database + API |
| **Clerk** | ^6.37.1 | Authentication |
| **@clerk/themes** | ^2.4.51 | Dark theme for Clerk UI |

### Icons & UI
| Technology | Version | Purpose |
|------------|---------|---------|
| **Lucide React** | ^0.563.0 | Icon library |

---

## UI/UX & Theme System

### Design Philosophy

The admin dashboard uses a **dark theme** optimized for long working sessions:

```
Color System:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Background Layers:
  #0b0f19  ─────  Deepest (page background)
  #111827  ─────  Surface (cards, sidebar)
  #1f2937  ─────  Hover states
  #2d3748  ─────  Borders

Text Colors:
  #e5e7eb  ─────  Primary text
  #9ca3af  ─────  Secondary text
  #6b7280  ─────  Muted text

Accent Colors:
  #10b981  ─────  Primary (Emerald green)
  #059669  ─────  Primary hover
  
Status Colors:
  #22c55e  ─────  Success (green)
  #f59e0b  ─────  Warning (amber)
  #ef4444  ─────  Error (red)
```

### Component Styling Patterns

**Cards/Panels:**
```css
.card {
  background: #111827;
  border: 1px solid #2d3748;
  border-radius: 0.75rem;  /* rounded-xl */
}
```

**Buttons:**
```css
/* Primary Button */
.btn-primary {
  background: #10b981;
  color: #0b0f19;
}
.btn-primary:hover {
  background: #059669;
}

/* Secondary/Ghost Button */
.btn-secondary {
  border: 1px solid #2d3748;
  background: transparent;
}
```

**Inputs:**
```css
.input {
  background: #0b0f19;
  border: 1px solid #2d3748;
  color: #e5e7eb;
}
.input:focus {
  border-color: #10b981;
  ring: 1px #10b981;
}
```

### Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ┌─────────┐  ┌─────────────────────────────────────────┐  │
│  │         │  │  Header (sticky, blur backdrop)          │  │
│  │         │  │  [Breadcrumb]              [UserButton]  │  │
│  │ Sidebar │  ├─────────────────────────────────────────┤  │
│  │ (fixed) │  │                                          │  │
│  │         │  │              Main Content                │  │
│  │ w-64    │  │              (scrollable)                │  │
│  │         │  │                                          │  │
│  │         │  │                                          │  │
│  │         │  │                                          │  │
│  └─────────┘  └─────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Responsive Considerations

Currently optimized for **desktop only** (min-width: 1024px).  
Mobile admin is not supported - admins should use desktop for content management.

---

## Backend Architecture

### Convex Database

The admin dashboard shares the same Convex database as the mobile app:

```
┌─────────────────────┐     ┌─────────────────────┐
│   Mobile App        │     │   Admin Dashboard   │
│   (React Native)    │     │   (Next.js)         │
└─────────┬───────────┘     └──────────┬──────────┘
          │                            │
          │    Real-time Sync          │
          └──────────┬─────────────────┘
                     │
          ┌──────────▼──────────┐
          │      CONVEX         │
          │  (Serverless DB)    │
          │                     │
          │  Tables:            │
          │  - users            │
          │  - communityPosts   │
          │  - FilterOption     │
          │  - comments         │
          │  - likes            │
          │  - savedContent     │
          │  - notifications    │
          └─────────────────────┘
```

### Key Backend Files

#### `convex/adminAuth.ts` - Security Layer
```typescript
// Validates admin access - throws error if not admin
export async function getAdmin(ctx): Promise<{ userId, identity }> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Unauthenticated");
  
  const user = await ctx.db.query("users")...
  if (!user.isAdmin) throw new Error("Admin access required");
  
  return { userId: user._id, identity };
}
```

#### `convex/adminFilters.ts` - Filter CRUD
```typescript
// Admin-only filter operations
export const createFilterNode = mutation({...});   // Create new filter
export const updateFilterNode = mutation({...});   // Update filter details
export const toggleFilterActive = mutation({...}); // Activate/deactivate
export const deleteFilterNode = mutation({...});   // Delete (cascade)
```

#### `convex/communityPosts.ts` - Post Management
```typescript
// Post queries and mutations
export const getCommunityPosts = query({...});     // List posts
export const createCommunityPost = mutation({...}); // Create post
export const adminDeleteCommunityPost = mutation({...}); // Delete post
```

### Authentication Flow

```
User visits /admin
       │
       ▼
┌──────────────────┐
│ Clerk Middleware │ ──── Not authenticated ────► Redirect to login
└────────┬─────────┘
         │ Authenticated
         ▼
┌──────────────────┐
│ Convex Query     │ ──── Not admin ────► Error: "Admin access required"
│ getAdmin(ctx)    │
└────────┬─────────┘
         │ Is Admin
         ▼
┌──────────────────┐
│ Render Admin UI  │
└──────────────────┘
```

---

## Key Code Snippets

### 1. Clerk + Convex Provider Setup

```tsx
// app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: "#10b981",
          colorBackground: "#111827",
        },
      }}
    >
      <html lang="en" className="dark">
        <body>
          <ConvexClientProvider>
            {children}
          </ConvexClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
```

### 2. Protected Route Middleware

```typescript
// middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher(["/admin(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});
```

### 3. Filter Tree Node Component

```tsx
// components/admin/FilterTree.tsx
export function FilterTreeNode({ filter, allFilters, depth, onSelect }) {
  const children = allFilters.filter(f => f.parentId === filter._id);
  const hasChildren = children.length > 0;
  
  return (
    <div>
      <div style={{ paddingLeft: `${depth * 20 + 8}px` }}>
        <button onClick={() => onToggleExpand(filter._id)}>
          {hasChildren && (isExpanded ? <ChevronDown /> : <ChevronRight />)}
        </button>
        <Icon className={typeColors[filter.type]} />
        <span onClick={() => onSelect(filter)}>{filter.name}</span>
      </div>
      
      {hasChildren && isExpanded && (
        children.map(child => (
          <FilterTreeNode key={child._id} filter={child} depth={depth + 1} />
        ))
      )}
    </div>
  );
}
```

### 4. Create Post with Filter Linking

```tsx
// app/admin/posts/new/page.tsx
const handleSubmit = async () => {
  await createPost({
    title: title.trim(),
    content: content.trim(),
    imageUrl: imageUrl || undefined,
    linkedFilterOptionIds: selectedFilterIds.length > 0 
      ? selectedFilterIds 
      : undefined,
    status,  // "draft" or "published"
  });
  
  addToast({ type: "success", title: "Post Created!" });
  router.push("/admin/posts");
};
```

---

## How to Use

### Creating a New Filter

1. Navigate to **Filters** page (`/admin/filters`)
2. In the tree view, find the parent where you want to add
3. Hover over the parent → Click **+** button
4. Fill in the modal:
   - **Name**: e.g., "React Developer"
   - **Type**: Auto-selected based on parent
   - **Description**: What this career path is about
   - **Requirements**: Skills/qualifications needed
   - **Salary**: Expected salary range
   - **Exams**: Relevant exams if any
5. Click **Create**

### Creating a New Post

1. Navigate to **Posts** → Click **Create Post**
2. Fill in the form:
   - **Title** (required): Clear, descriptive headline
   - **Content** (required): Full post content
   - **Image URL** (optional): Add a cover image
   - **Filters** (optional): Link to career paths
3. Choose action:
   - **Save Draft**: Save without publishing
   - **Publish**: Make visible in mobile app immediately

### Managing Existing Content

**Edit a Filter:**
1. Click on filter in tree view
2. Inspector panel opens on right
3. Click **Edit** button
4. Modify fields → **Save**

**Deactivate a Filter:**
1. Select filter
2. Click **Deactivate** (toggles isActive)
3. Filter and children hidden from mobile app

**Delete a Post:**
1. Find post in table
2. Click trash icon
3. Confirm deletion

---

## Development Setup

### Prerequisites

- Node.js 18+
- npm or pnpm
- Convex account
- Clerk account

### Installation

```bash
# 1. Navigate to admin-dashboard folder
cd admin-dashboard

# 2. Install dependencies
npm install

# 3. Set up environment variables
# Create .env.local with:
NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# 4. Start Convex (if not already running)
npx convex dev

# 5. Start Next.js dev server
npm run dev
```

### Environment Variables

```env
# .env.local
NEXT_PUBLIC_CONVEX_URL=https://example.convex.cloud
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_example
CLERK_SECRET_KEY=sk_test_example
```

### Available Scripts

```bash
npm run dev      # Start development server (http://localhost:3000)
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

---

## Progress Tracker

### ✅ Completed Features

| Feature | Status | Notes |
|---------|--------|-------|
| Dashboard Home | ✅ Done | Stats, quick actions, recent items |
| Sidebar Navigation | ✅ Done | Logo, nav links, active states |
| Header with Breadcrumb | ✅ Done | Auto-generated breadcrumbs |
| Clerk Authentication | ✅ Done | Dark theme, protected routes |
| Convex Integration | ✅ Done | Real-time data sync |
| Filter Tree View | ✅ Done | Expand/collapse, color-coded |
| Filter Inspector | ✅ Done | View and edit filter details |
| Add Filter Modal | ✅ Done | Create child/root filters |
| Filter Activate/Deactivate | ✅ Done | Toggle isActive status |
| Posts Table | ✅ Done | Search, filter, loading states |
| Create New Post | ✅ Done | Title, content, image, filters |
| Delete Post | ✅ Done | Confirmation dialog |
| Toast Notifications | ✅ Done | Success, error, warning types |
| Form Validation | ✅ Done | Required fields, error messages |
| Loading States | ✅ Done | Skeletons, spinners |

### 🚧 In Progress

| Feature | Status | Notes |
|---------|--------|-------|
| Edit Post | 🚧 Partial | Need to add edit page |
| Users Management | 🚧 Planned | View/manage app users |

### ❌ Not Started

| Feature | Priority | Notes |
|---------|----------|-------|
| Settings Page | Medium | App configuration |
| Analytics Dashboard | Medium | Charts, graphs, trends |
| Image Upload | High | Direct upload vs URL |
| Bulk Actions | Medium | Select multiple, delete |
| Filter Search | Low | Search within tree |
| Export Data | Low | CSV/JSON export |
| Audit Log | Low | Track admin actions |
| Rich Text Editor | Medium | Markdown/WYSIWYG for posts |
| Mobile Responsive | Low | Not priority, desktop-first |

---

## Future Modifications

### High Priority

#### 1. Edit Post Page
```
Location: app/admin/posts/[id]/edit/page.tsx
Features:
- Load existing post data
- Pre-fill form fields
- Update mutation
- Redirect after save
```

#### 2. Image Upload
```
Current: Paste image URL manually
Needed: Upload to Convex file storage
- Add drag-and-drop zone
- Integrate Convex storage API
- Show upload progress
- Generate thumbnail preview
```

#### 3. User Management
```
Location: app/admin/users/page.tsx
Features:
- List all registered users
- View user profiles
- Toggle admin status
- View user activity (comments, likes)
```

### Medium Priority

#### 4. Analytics Dashboard
```
Location: app/admin/analytics/page.tsx
Features:
- Post engagement over time (chart)
- Most viewed career paths
- User growth chart
- Comment/like trends
```

#### 5. Rich Text Editor for Posts
```
Options:
- TipTap (recommended)
- Slate.js
- Draft.js

Features:
- Bold, italic, lists
- Code blocks
- Image embedding
- Link insertion
```

#### 6. Bulk Actions for Posts
```
Features:
- Select multiple posts
- Bulk publish
- Bulk delete
- Bulk assign filters
```

### Low Priority

#### 7. Settings Page
```
Location: app/admin/settings/page.tsx
Features:
- App name/description
- Default filter settings
- Notification preferences
- API keys management
```

#### 8. Audit Log
```
Track admin actions:
- Who created/edited what
- Timestamps
- IP addresses
- Changes made
```

#### 9. Export Functionality
```
Export options:
- Filters as JSON
- Posts as CSV
- Users list
- Backup entire database
```

---

## Support & Resources

### Documentation Links

- **Next.js**: https://nextjs.org/docs
- **Convex**: https://docs.convex.dev
- **Clerk**: https://clerk.com/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Lucide Icons**: https://lucide.dev

### Quick Commands

```bash
# Start development
cd admin-dashboard && npm run dev

# Run Convex backend
npx convex dev

# Push Convex schema changes
npx convex deploy

# Check for lint errors
npm run lint
```

---

**Last Updated:** 2026-02-01  
**Version:** 1.0.0  
**Maintainer:** SkillsApp Team
