<<<<<<< HEAD
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Start development server
npm start           # Expo development server
npm run android     # Run on Android
npm run ios         # Run on iOS
npm run web         # Run on web

# Code quality
npm run lint        # ESLint code analysis

# Database seeding
npm run seed        # Complete database seeding (filters + posts)
npm run seed-filters # Seed only filter hierarchy
npm run seed-posts  # Seed only sample posts

# Manual Convex commands
npx convex run seedData:seedFilters
npx convex run seedData:seedPosts
```

## Architecture Overview

### Core Stack
- **Frontend**: React Native with Expo Router (file-based routing)
- **Backend**: Convex (real-time database with built-in functions)
- **Authentication**: Clerk with Convex integration
- **Navigation**: Expo Router with tab-based layout

### Database Schema
This is a career-focused social media app with a hybrid content model:

1. **FilterOption**: Hierarchical career path structure (qualification → category → sector → subsector → branch → role)
2. **communityPosts**: User-generated content linked to career paths
3. **users**: User profiles managed via Clerk integration
4. **likes/comments**: Engagement on both career paths AND community posts
5. **savedContent**: Bookmarking system for both content types
6. **notifications**: Activity notifications

### Key Architecture Patterns

**Authentication Flow**: 
- Clerk handles auth, InitialLayout.tsx manages user creation in Convex
- Auto-redirects between auth screens and main tabs
- Creates Convex user record on first sign-in

**Data Layer**:
- All database operations go through Convex mutations/queries
- Real-time updates via Convex subscriptions
- Schema supports both legacy and new data formats

**Navigation**:
- `app/_layout.tsx`: Root layout with providers
- `app/(tabs)/`: Main app tabs (feed, create, bookmarks, profile, notifications)
- `app/(auth)/`: Authentication screens
- `app/user/[id].tsx`: Dynamic user profiles

### Environment Variables Required
```env
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=
CONVEX_DEPLOYMENT=dev:your-deployment
EXPO_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
CONVEX_ADMIN_KEY=
```

### Seeding System
- Use `npm run seed` for complete setup
- Creates hierarchical career path filters from qualification level down to specific roles
- Populates sample job posts with proper filter associations
- All seeding is idempotent and can be run multiple times

### Component Structure
- Components follow React Native patterns with StyleSheet
- Styles organized in separate `styles/` directory by feature
- Theme constants in `constants/theme.ts`
=======
# SkillsApp - Claude Code Project Context

## Project Overview

**SkillsApp** is a mobile-first career discovery platform for Indian students and young professionals. Unlike traditional social media, this app uses an **admin-curated content model** where only admins post career-related content, while users can engage through likes, comments, and bookmarks.

### Mission
Democratize career awareness in India by exposing students to the full spectrum of career possibilities based on their current qualification level (10th, 12th, Diploma, Graduation).

### Key Differentiator
**6-level hierarchical filter system** that allows students to discover career paths they never knew existed:
```
Qualification → Category → Sector → SubSector → Branch → Role
```

Example: `Graduation → Government Jobs → Defence → Indian Navy → Executive Branch → Navy Pilot`

---

## Tech Stack

- **Framework**: React Native 0.79.5 with Expo SDK 53
- **Navigation**: Expo Router 5.1 (file-based routing)
- **Backend**: Convex (serverless real-time database)
- **Authentication**: Clerk (Google OAuth SSO)
- **Language**: TypeScript
- **Styling**: React Native StyleSheet + Custom Theme System
- **Animations**: react-native-reanimated

---

## Project Structure

```
D:\SKILLMEDIA\SkillsAppNew\
├── app/                          # Expo Router navigation
│   ├── (auth)/                   # Public auth screens
│   │   └── login.tsx            # Google OAuth login
│   ├── (tabs)/                   # Protected tab screens
│   │   ├── index.tsx            # 🎯 Main feed with filters
│   │   ├── bookmarks.tsx        # Saved content
│   │   ├── create.tsx           # Admin post creation
│   │   ├── notifications.tsx    # Engagement notifications
│   │   └── profile.tsx          # User profile
│   └── _layout.tsx              # Root layout with providers
│
├── components/                   # Reusable UI components
│   ├── ui/                      # Atomic components
│   │   ├── Typography.tsx
│   │   ├── AnimatedButton.tsx
│   │   └── AnimatedCard.tsx
│   ├── FilterModal.tsx          # 🎯 Hierarchical filter UI
│   ├── CareerPathDetails.tsx    # Career path card display
│   └── CommunityPost.tsx        # Post card component
│
├── convex/                       # Backend (Convex serverless)
│   ├── schema.ts                # 🎯 Database schema (7 tables)
│   ├── seedData.ts              # 🎯 Seeding scripts
│   ├── filter.ts                # Filter queries
│   ├── communityPosts.ts        # Post CRUD
│   ├── comments.ts              # Comment operations
│   ├── savedContent.ts          # Bookmark functionality
│   └── notifications.ts         # Notification system
│
├── providers/
│   ├── ClerkAndConvexProvider.tsx  # Auth + DB wrapper
│   └── ThemeProvider.tsx           # Dark/Light theme
│
├── types/
│   └── index.ts                 # 🎯 All TypeScript types
│
├── constants/
│   └── theme.ts                 # Theme tokens
│
└── types/docs/
    └── APP_FULL_REPORT.md      # 📚 Complete project documentation
```

### 🎯 Most Important Files

1. **`app/(tabs)/index.tsx`** - Main feed screen with dual-mode display (all posts vs filtered career path)
2. **`components/FilterModal.tsx`** - Hierarchical filter navigation with breadcrumb trail
3. **`convex/schema.ts`** - Database schema with 7 tables
4. **`convex/seedData.ts`** - Seed filters and posts
5. **`types/index.ts`** - All TypeScript type definitions
6. **`types/docs/APP_FULL_REPORT.md`** - Complete project documentation

---

## Database Schema

### 7 Tables in Convex

1. **FilterOption** - Hierarchical career paths (6 levels deep)
2. **communityPosts** - Admin-created posts linked to career paths
3. **users** - User profiles with `isAdmin` flag
4. **comments** - Comments on posts OR career paths (with nested replies)
5. **likes** - Likes on posts OR career paths
6. **savedContent** - Bookmarks for posts OR career paths
7. **notifications** - Like/comment/follow notifications

### Key Schema Pattern: Dual Content Model

Both **FilterOptions (career paths)** and **CommunityPosts** can be:
- Liked
- Commented on
- Saved/bookmarked

This is reflected in schemas:
```typescript
// Comments can be on posts OR career paths
comments: {
  communityPostId?: Id<"communityPosts">,
  filterOptionId?: Id<"FilterOption">,
}

// Likes can be on posts OR career paths
likes: {
  communityPostId?: Id<"communityPosts">,
  filterOptionId?: Id<"FilterOption">,
}
```

---

## Core Concepts

### 1. Hierarchical Filter System

**6-Level Hierarchy:**
```
Level 1: Qualification (10th, 12th, Diploma, Graduation)
Level 2: Category (Government Jobs, Private Jobs, Business, Sports, Agriculture)
Level 3: Sector (Defence, Banking, Railways, IT, Manufacturing, etc.)
Level 4: SubSector (Indian Army, Navy, Air Force, Software Dev, Data Science, etc.)
Level 5: Branch (Executive, Technical, Frontend, Backend, etc.)
Level 6: Role (Navy Pilot, React Developer, etc.)
```

**Database Structure:**
```typescript
FilterOption {
  _id: Id<"FilterOption">,
  name: string,
  type: "qualification" | "category" | "sector" | "subSector" | "branch" | "role",
  parentId: Id<"FilterOption"> | null,  // null = root level

  // Rich content
  description?: string,
  requirements?: string,
  avgSalary?: string,
  relevantExams?: string,

  // Engagement
  likes?: number,
  comments?: number,
}
```

### 2. Dual Content Display Mode

**Feed screen (`app/(tabs)/index.tsx`) has TWO modes:**

**Mode 1: No filters selected**
- Shows all community posts in chronological order
- Pull-to-refresh enabled
- Infinite scroll (future)

**Mode 2: Filter selected**
- Shows breadcrumb path (e.g., "Graduation > Defence > Navy > Pilot")
- Displays **Career Path Card** with full details (salary, exams, requirements)
- Shows **related community posts** tagged with this career path
- Users can like, comment, save the career path itself

### 3. Admin-Only Posting

- Only users with `isAdmin: true` can create posts
- Posts are linked to career paths via `linkedFilterOptionIds` array
- Posts can be linked to multiple career paths
- Regular users can only: View, Like, Comment, Save

### 4. Theme System

- Dark/Light mode with system preference detection
- Persisted in AsyncStorage
- Complete design token system in `constants/theme.ts`
- All components use theme via `useTheme()` hook

---

## Common Development Tasks

### Adding New Filter Options (Career Paths)

**Method 1: Via Seeding (Recommended)**

Edit `convex/seedData.ts`:

```typescript
export const seedFilterOptions = mutation({
  args: {},
  handler: async (ctx) => {
    // Get parent
    const graduation = await ctx.db
      .query("FilterOption")
      .filter((q) => q.eq(q.field("name"), "Graduation"))
      .first();

    // Insert child
    await ctx.db.insert("FilterOption", {
      name: "New Category",
      type: "category",
      parentId: graduation._id,
      description: "Description here",
      isActive: true,
    });
  },
});
```

Run: `npx convex run seedData:seedFilterOptions`

### Adding New Posts

**Via Seeding:**

```typescript
export const seedCommunityPosts = mutation({
  args: {},
  handler: async (ctx) => {
    const adminUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("isAdmin"), true))
      .first();

    const filterOption = await ctx.db
      .query("FilterOption")
      .filter((q) => q.eq(q.field("name"), "React Developer"))
      .first();

    await ctx.db.insert("communityPosts", {
      userId: adminUser._id,
      content: "Your post content here",
      linkedFilterOptionIds: [filterOption._id],
      likes: 0,
      comments: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isActive: true,
    });
  },
});
```

Run: `npx convex run seedData:seedCommunityPosts`

### Running Convex Queries/Mutations

**In React components:**

```typescript
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

// Query (read data)
const posts = useQuery(api.communityPosts.getCommunityPosts);

// Mutation (write data)
const createPost = useMutation(api.communityPosts.createCommunityPost);
await createPost({ content: "...", linkedFilterOptionIds: [...] });
```

### Working with Types

All types are in `types/index.ts`:

```typescript
import { CommunityPost, FilterOption, User, Comment } from "@/types";

// Types are auto-generated from Convex schema
import { Id } from "@/convex/_generated/dataModel";

// Use Id type for references
const postId: Id<"communityPosts"> = "...";
const filterId: Id<"FilterOption"> = "...";
```

---

## Important Patterns & Conventions

### 1. Navigation

Uses **Expo Router** (file-based):
- `app/(tabs)/index.tsx` → `/` (home)
- `app/(tabs)/profile.tsx` → `/profile`
- `app/user/[userId].tsx` → `/user/123` (dynamic)

Navigation:
```typescript
import { router } from "expo-router";

router.push("/profile");
router.push(`/user/${userId}`);
router.back();
```

### 2. Theme Usage

```typescript
import { useTheme } from "@/providers/ThemeProvider";

const { theme } = useTheme();

<View style={{ backgroundColor: theme.colors.background }} />
<Typography variant="h2" color={theme.colors.text}>
  Title
</Typography>
```

### 3. Filter Query Pattern

```typescript
// Get root-level filters (qualifications)
const qualifications = useQuery(
  api.filter.getFilterChildren,
  { parentId: undefined }
);

// Get children of a filter
const children = useQuery(
  api.filter.getFilterChildren,
  { parentId: selectedFilterId }
);

// Get filter details
const filterDetails = useQuery(
  api.filter.getFilterOptionById,
  { id: filterId }
);
```

### 4. Post Query Pattern

```typescript
// Get all posts
const posts = useQuery(api.communityPosts.getCommunityPosts);

// Get posts by filter
const filteredPosts = useQuery(
  api.communityPosts.getCommunityPostsByFilterOption,
  { filterOptionId: filterId }
);

// Get user's posts
const userPosts = useQuery(
  api.communityPosts.getCommunityPostsByUser,
  { userId: userId }
);
```

### 5. Authentication Check

```typescript
import { useUser } from "@clerk/clerk-expo";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

const { user: clerkUser } = useUser();
const convexUser = useQuery(
  api.users.getUserByClerkId,
  clerkUser ? { clerkId: clerkUser.id } : "skip"
);

const isAdmin = convexUser?.isAdmin ?? false;
```

---

## Key API Endpoints (Convex)

### Filter Queries

| Endpoint | Args | Returns |
|----------|------|---------|
| `filter.getFilterChildren` | `{ parentId?: Id }` | `FilterOption[]` |
| `filter.getFilterOptionById` | `{ id: Id }` | `FilterOption \| null` |
| `filter.getFilterNamesByIds` | `{ ids: Id[] }` | `string[]` |

### Post Queries/Mutations

| Endpoint | Args | Returns |
|----------|------|---------|
| `communityPosts.getCommunityPosts` | None | `CommunityPost[]` (max 20) |
| `communityPosts.getCommunityPostsByFilterOption` | `{ filterOptionId: Id }` | `CommunityPost[]` |
| `communityPosts.createCommunityPost` | `{ content, linkedFilterOptionIds }` | `Id` |
| `communityPosts.deleteCommunityPost` | `{ id: Id }` | `void` |

### Comment Mutations

| Endpoint | Args | Returns |
|----------|------|---------|
| `comments.addComment` | `{ content, communityPostId?, filterOptionId? }` | `Id` |
| `comments.getComments` | `{ communityPostId?, filterOptionId? }` | `Comment[]` |

### Saved Content

| Endpoint | Args | Returns |
|----------|------|---------|
| `savedContent.toggleSave` | `{ communityPostId?, filterOptionId? }` | `boolean` |
| `savedContent.getIsSaved` | `{ communityPostId?, filterOptionId? }` | `boolean` |

---

## Development Workflow

### Starting the App

```bash
# Terminal 1: Start Convex backend
npx convex dev

# Terminal 2: Start Expo
npm start

# Press 'a' for Android
# Press 'i' for iOS
# Press 'w' for web
```

### Seeding Data

```bash
# Seed filter hierarchy
npx convex run seedData:seedFilterOptions

# Seed posts
npx convex run seedData:seedCommunityPosts
```

### Common Commands

```bash
npm install              # Install dependencies
npm start                # Start Expo dev server
npm run android          # Run on Android
npm run ios              # Run on iOS
npx convex dev           # Start Convex backend
npx convex deploy        # Deploy to Convex cloud
```

---

## File Naming Conventions

- **Components**: PascalCase (`FilterModal.tsx`, `CommunityPost.tsx`)
- **Screens**: camelCase for routes (`index.tsx`, `profile.tsx`, `[userId].tsx`)
- **Utilities**: camelCase (`theme.ts`)
- **Types**: PascalCase interfaces in `types/index.ts`
- **Backend**: camelCase files (`communityPosts.ts`, `filter.ts`)

---

## Code Style Guidelines

### 1. Component Structure

```typescript
import { useState } from "react";
import { View } from "react-native";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useTheme } from "@/providers/ThemeProvider";

// Props type
interface MyComponentProps {
  postId: Id<"communityPosts">;
}

export default function MyComponent({ postId }: MyComponentProps) {
  // Hooks
  const { theme } = useTheme();
  const [state, setState] = useState();
  const data = useQuery(api.communityPosts.getCommunityPostById, { id: postId });

  // Handlers
  const handlePress = () => {
    // ...
  };

  // Early returns
  if (!data) return <LoadingSpinner />;

  // Render
  return (
    <View style={{ backgroundColor: theme.colors.background }}>
      {/* JSX */}
    </View>
  );
}
```

### 2. Mutation Pattern

```typescript
const updatePost = useMutation(api.communityPosts.updateCommunityPost);

const handleUpdate = async () => {
  try {
    await updatePost({
      id: postId,
      content: newContent,
    });
    alert("Updated!");
  } catch (error) {
    console.error("Failed to update:", error);
    alert("Error updating post");
  }
};
```

### 3. Conditional Rendering

```typescript
// Good: Use early returns for loading/error states
if (isLoading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} />;

// Good: Use ternary for simple conditions
{isAdmin && <AdminButton />}
{user ? <ProfileButton /> : <LoginButton />}

// Avoid: Deep nesting
// Bad:
{data && data.items && data.items.length > 0 && (
  <List items={data.items} />
)}

// Good:
{data?.items?.length > 0 && <List items={data.items} />}
```

---

## Known Issues & Work in Progress

1. **Likes functionality** - Backend exists but currently disabled in UI (`convex/likes.ts` is empty)
2. **Nested comments** - Type support exists but UI rendering not implemented
3. **Image upload** - Referenced but not fully functional
4. **Follow system** - Schema exists but not fully implemented
5. **Search** - Not yet implemented

---

## Testing the App

### Manual Test Checklist

**Authentication:**
- Login with Google works
- Profile created in Convex
- Profile image synced

**Filters:**
- Root qualifications load
- Drill down works through all 6 levels
- Breadcrumb shows correct path
- Apply filters updates feed
- Clear filters resets to all posts

**Posts:**
- All posts load on home
- Filter-specific posts show when filtered
- Like/comment/save buttons work
- Post creation (admin only)

**Career Paths:**
- Career path card shows when filter selected
- Displays description, salary, exams, requirements
- Can like/comment/save career paths

---

## Environment Variables

Create `.env.local` in root:

```env
EXPO_PUBLIC_CONVEX_URL=https://your-project.convex.cloud
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
```

---

## Deployment

### Convex
```bash
npx convex deploy
```

### Expo
```bash
# Build
eas build --platform android
eas build --platform ios

# Submit
eas submit --platform android
eas submit --platform ios
```

---

## Helpful Resources

- **Full Documentation**: `types/docs/APP_FULL_REPORT.md`
- **Convex Dashboard**: https://dashboard.convex.dev
- **Clerk Dashboard**: https://dashboard.clerk.com
- **Expo Docs**: https://docs.expo.dev
- **Convex Docs**: https://docs.convex.dev

---

## Quick Reference: Filter Hierarchy Example

```
Graduation (qualification)
  └── Government Jobs (category)
      └── Defence Services (sector)
          └── Indian Navy (subSector)
              └── Executive Branch (branch)
                  └── Navy Pilot (role)
                      ├── Description: "Fly fighter jets..."
                      ├── Requirements: "Physics & Math, Age 20-24"
                      ├── Salary: "₹56,100 - ₹1,77,500/month"
                      └── Exams: "INET, SSB Interview"
```

---

## When Working on This Project

1. **Adding features?** Check `types/docs/APP_FULL_REPORT.md` for architecture
2. **Modifying schema?** Update in `convex/schema.ts` and types in `types/index.ts`
3. **Adding screens?** Use Expo Router conventions in `app/` directory
4. **Creating components?** Follow atomic design pattern in `components/ui/`
5. **Styling?** Use theme system via `useTheme()` hook
6. **Need data?** Run seeding scripts in `convex/seedData.ts`

---

**Last Updated**: 2026-01-11
**Project Version**: 1.0.0
**Expo SDK**: 53
**React Native**: 0.79.5
**Convex**: ^1.17.7
>>>>>>> a4fdb67 (create md files for adding next features)
