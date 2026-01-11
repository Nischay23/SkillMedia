# SkillsApp - Comprehensive App Report

## Table of Contents

1. [Use Cases](#use-cases)
2. [Executive Summary](#executive-summary)
3. [App Overview](#app-overview)
4. [Technology Stack](#technology-stack)
5. [Project Structure](#project-structure)
6. [Database Schema](#database-schema)
7. [Key Features](#key-features)
8. [How to Add Posts](#how-to-add-posts)
9. [How to Add Filter Options](#how-to-add-filter-options)
10. [Filter System Deep Dive](#filter-system-deep-dive)
11. [API Reference](#api-reference)
12. [User Flows](#user-flows)
13. [Future Enhancements](#future-enhancements)

---

## Use Cases

### Primary Use Case: Career Discovery for Indian Students

**Problem Statement:**
In India, young students (especially after 10th and 12th standard) are typically only aware of 7-10 traditional career paths:

- Engineering
- Medical
- MBA
- CA (Chartered Accountant)
- Government Jobs (UPSC)
- Teaching
- Law

This limited awareness means students miss out on hundreds of other career opportunities in:

- Agriculture & Allied sectors
- Sports & Fitness
- Business & Entrepreneurship
- Specialized government sectors (Defence, Railways, Banking, PSUs)
- Diverse private sector roles (IT, Manufacturing, Retail, Finance)
- Creative fields (Media, Design, Arts)

### Specific Use Cases

#### Use Case 1: 12th Standard Student Exploring Government Jobs

**Actor:** 18-year-old student who just passed 12th standard

**Flow:**

1. Opens SkillsApp and sees all career-related posts
2. Clicks on "Filter" button in home screen
3. Selects "12th Standard" as qualification
4. Sees categories: Government Jobs, Private Jobs, Business, Sports, Agriculture
5. Selects "Government Jobs"
6. Sees sectors available after 12th:
   - Defence Services (NDA, Coast Guard)
   - Railway Jobs (RRB Group D, NTPC)
   - Banking (IBPS Clerk)
   - SSC (SSC CHSL, SSC GD)
   - Police Forces (State Police Constable)
7. Selects "Defence Services"
8. Sees detailed career path card showing:
   - Description of defence career opportunities
   - Requirements (Age limit, Physical standards, Education)
   - Average salary range
   - Relevant exams (NDA, CDS for 12th pass)
   - Related community posts from admin
9. Can like, comment, and save this career path
10. Can view all posts tagged with this specific path

**Outcome:** Student discovers NDA (National Defence Academy) which they never knew was available right after 12th standard.

---

#### Use Case 2: Graduate Student Exploring Defence Options

**Actor:** 22-year-old graduate who wants to serve in defence but doesn't know specific options

**Flow:**

1. Opens filter modal
2. Selects "Graduation" → "Government Jobs" → "Defence Services"
3. Sees all defence branches:
   - Indian Army (IMA/OTA via CDS)
   - Indian Navy (Executive, Technical, Logistics)
   - Indian Air Force (Flying, Ground Duty Tech/Non-Tech via AFCAT)
   - Paramilitary Forces (CAPF via UPSC - BSF, CRPF, ITBP, CISF, SSB)
   - Territorial Army
4. Selects "Indian Navy"
5. Sees sub-branches:
   - Executive Branch
   - Technical Branch
   - Logistics Branch
   - Law Branch
6. Selects "Executive Branch"
7. Sees roles like:
   - SSC Officer (Short Service Commission)
   - Permanent Commission Officer
   - Navy Pilot (via INET)
8. Taps on "Navy Pilot" role
9. Sees complete details:
   - **Description:** "Fly advanced aircraft from aircraft carriers and naval air stations"
   - **Requirements:** "Graduation with Physics & Math at 10+2, Age: 20-24, Medical fitness"
   - **Salary:** "₹56,100 - ₹1,77,500 per month"
   - **Exams:** "INET (Indian Navy Entrance Test), SSB Interview"
10. Reads admin-posted articles about life as a Navy Pilot
11. Saves this career path for future reference
12. Comments asking questions

**Outcome:** Student now has a clear roadmap - needs to prepare for INET exam and knows exact age/qualification requirements.

---

#### Use Case 3: Engineering Graduate Confused Between Many IT Options

**Actor:** 23-year-old B.Tech graduate overwhelmed by IT job market

**Flow:**

1. Applies filter: "Graduation" → "Private Jobs" → "IT & Software"
2. Sees organized sectors:
   - Software Development (Frontend, Backend, Full Stack, Mobile)
   - Data Science & AI
   - Cybersecurity
   - Cloud & DevOps
   - Product Management
3. Explores "Software Development" → "Frontend Development"
4. Sees specific role paths:
   - React Developer
   - Angular Developer
   - Vue.js Developer
5. Taps "React Developer"
6. Career path card shows:
   - **Description:** "Build dynamic, responsive user interfaces using React.js"
   - **Requirements:** "JavaScript (ES6+), React.js, Redux/Context API, HTML5, CSS3, Git"
   - **Salary:** "Fresher: ₹3-6 LPA, Experienced: ₹6-15+ LPA"
   - **Exams:** "N/A (Portfolio & skills-based hiring)"
7. Sees admin posts with:
   - React roadmap for beginners
   - Top 10 React interview questions
   - Salary negotiation tips
   - Portfolio project ideas
8. Likes and saves multiple posts
9. Decides to focus learning path on React

**Outcome:** Student gets clarity on focused learning path instead of being overwhelmed.

---

#### Use Case 4: 10th Pass Student from Rural Area

**Actor:** 16-year-old from village who dropped education due to financial constraints

**Flow:**

1. Opens app and applies filter: "10th Standard"
2. Sees all available paths (not just studying further):
   - Government Jobs (Railway Group D, SSC GD Constable, Police)
   - Agriculture & Allied (Modern farming, Dairy, Poultry)
   - Sports & Fitness (State-level athlete, Gym trainer)
   - Business (Small-scale manufacturing, Retail)
   - Skilled Trades (Electrician, Plumber, Carpenter via ITI)
3. Selects "Agriculture & Allied" (familiar domain)
4. Discovers modern opportunities:
   - Organic Farming Entrepreneur
   - Dairy Farm Management
   - Horticulture Specialist
   - Agricultural Equipment Operator
5. Sees posts about government schemes:
   - PM Kisan Samman Nidhi
   - Startup India for agriculture
   - Subsidies for dairy farming
6. Realizes agriculture can be profitable with modern techniques

**Outcome:** Student considers staying in agriculture but with modern, entrepreneurial approach instead of migrating to city for low-wage labor.

---

## Executive Summary

**SkillsApp** is a mobile-first career discovery platform designed specifically for Indian students and young professionals. Unlike traditional social media where users create content, SkillsApp follows an **admin-curated model** where career experts post high-quality, verified information about career paths.

### Key Differentiators

1. **Admin-Only Posting**: Ensures quality, verified career information (no spam or misinformation)
2. **Hierarchical Filter System**: 6-level deep filtering allows precise career path discovery
3. **Dual Content Model**:
   - Career Path Cards (structured data: salary, exams, requirements)
   - Community Posts (articles, tips, success stories)
4. **Qualification-First Design**: Starts with user's current education level (10th, 12th, Diploma, Graduation)
5. **Comprehensive Coverage**: From traditional (UPSC, Engineering) to unconventional (Agriculture, Sports, Trades)
6. **Engagement on Career Paths**: Users can like, comment, and discuss specific career options
7. **Personalized Feed**: Filter combinations show tailored content

### Mission

To democratize career awareness in India by exposing students to the full spectrum of career possibilities based on their current qualification level.

### Target Audience

- 10th-12th standard students (15-18 years)
- Diploma students
- College graduates (18-25 years)
- Parents and career counselors
- Young professionals exploring career switches

---

## App Overview

### Core Functionality

```
┌─────────────────────────────────────────────────────────┐
│                    SkillsApp Home                      │
│                                                         │
│  [Filter Button]                                       │
│                                                         │
│  ┌──────────────────────────────────────────────┐    │
│  │  Selected Filter Path (if any):             │    │
│  │  Graduation > Govt Jobs > Defence > Navy    │    │
│  └──────────────────────────────────────────────┘    │
│                                                         │
│  ┌──────────────────────────────────────────────┐    │
│  │  Career Path Card (if filter selected)      │    │
│  │  ┌────────────────────────────────────────┐ │    │
│  │  │  Navy Pilot                             │ │    │
│  │  │  Description: Fly advanced aircraft...  │ │    │
│  │  │  Salary: ₹56,100 - ₹1,77,500/month     │ │    │
│  │  │  Exams: INET, SSB Interview            │ │    │
│  │  │  [Like] [Comment] [Save]               │ │    │
│  │  └────────────────────────────────────────┘ │    │
│  └──────────────────────────────────────────────┘    │
│                                                         │
│  Community Posts:                                      │
│  ┌──────────────────────────────────────────────┐    │
│  │ @admin_naval_career                         │    │
│  │ Life as a Navy Pilot: My journey...         │    │
│  │ [Image]                                     │    │
│  │ 234 likes • 45 comments                     │    │
│  └──────────────────────────────────────────────┘    │
│                                                         │
│  ┌──────────────────────────────────────────────┐    │
│  │ @admin_defence                               │    │
│  │ Top 10 Questions in SSB Interview            │    │
│  │ [Image]                                     │    │
│  │ 567 likes • 89 comments                     │    │
│  └──────────────────────────────────────────────┘    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Tab Navigation

1. **Home (Feed)**: Main feed with filters and posts
2. **Bookmarks**: Saved career paths and posts
3. **Create**: Admin-only post creation (disabled for regular users)
4. **Notifications**: Likes, comments on your interactions
5. **Profile**: User profile, edit bio, view your comments

---

## Technology Stack

### Frontend

- **Framework**: React Native 0.79.5
- **Navigation**: Expo Router 5.1 (file-based routing)
- **Platform**: Expo SDK 53
- **Language**: TypeScript
- **Styling**: StyleSheet API + Custom Theme System
- **Animations**: react-native-reanimated
- **Icons**: @expo/vector-icons (MaterialIcons, Ionicons, Feather)
- **Images**: expo-image (optimized image loading)

### Backend

- **Database**: Convex (Real-time serverless database)
- **Authentication**: Clerk (with Google OAuth SSO)
- **Image Storage**: Convex file storage
- **Real-time Sync**: Convex React hooks (useQuery, useMutation)

### Development Tools

- **Package Manager**: npm
- **Version Control**: Git
- **TypeScript**: Full type safety
- **Linting**: ESLint
- **Testing**: (Not yet configured)

### Key Dependencies

```json
{
  "expo": "~53.0.3",
  "react-native": "0.79.5",
  "convex": "^1.17.7",
  "@clerk/clerk-expo": "^2.7.3",
  "react-native-reanimated": "^3.17.7",
  "expo-router": "^5.1.1",
  "@react-native-async-storage/async-storage": "^2.1.0"
}
```

---

## Project Structure

```
D:\SKILLMEDIA\SkillsAppNew\
│
├── app/                                    # Expo Router - File-based navigation
│   ├── (auth)/                            # Authentication screens (public)
│   │   ├── login.tsx                      # Google OAuth login screen
│   │   └── _layout.tsx                    # Auth stack layout
│   │
│   ├── (tabs)/                            # Main app tabs (protected)
│   │   ├── index.tsx                      # Home/Feed screen ⭐ MAIN SCREEN
│   │   ├── bookmarks.tsx                  # Saved content screen
│   │   ├── create.tsx                     # Create post (admin only)
│   │   ├── notifications.tsx              # Notification center
│   │   ├── profile.tsx                    # User profile screen
│   │   └── _layout.tsx                    # Bottom tab navigation
│   │
│   ├── user/                              # User detail screens
│   │   └── [userId].tsx                   # View other user's profile
│   │
│   ├── _layout.tsx                        # Root layout (providers)
│   └── +not-found.tsx                     # 404 screen
│
├── components/                             # Reusable UI components
│   ├── ui/                                # Atomic design components
│   │   ├── Typography.tsx                 # Text component with variants
│   │   ├── AnimatedButton.tsx             # Button with spring animations
│   │   └── AnimatedCard.tsx               # Card with entrance animations
│   │
│   ├── CommunityPost.tsx                  # Post card component ⭐
│   ├── Post.tsx                           # Alternative post component
│   ├── CareerPathDetails.tsx              # Career path info card ⭐
│   ├── FilterModal.tsx                    # Hierarchical filter UI ⭐
│   ├── Comment.tsx                        # Comment component
│   ├── InitialLayout.tsx                  # Auth wrapper component
│   └── [other components]
│
├── convex/                                 # Backend (Convex serverless)
│   ├── schema.ts                          # Database schema ⭐
│   ├── seedData.ts                        # Data seeding scripts ⭐
│   │
│   ├── filter.ts                          # Filter queries ⭐
│   ├── communityPosts.ts                  # Post CRUD operations ⭐
│   ├── users.ts                           # User management
│   ├── comments.ts                        # Comment operations
│   ├── likes.ts                           # Like functionality (disabled)
│   ├── savedContent.ts                    # Save/bookmark operations
│   ├── notifications.ts                   # Notification system
│   │
│   ├── _generated/                        # Auto-generated Convex types
│   │   ├── api.d.ts
│   │   └── dataModel.d.ts
│   │
│   └── convex.config.ts                   # Convex configuration
│
├── providers/                              # Context providers
│   ├── ClerkAndConvexProvider.tsx         # Auth + DB provider
│   └── ThemeProvider.tsx                  # Dark/Light theme provider
│
├── constants/                              # App constants
│   └── theme.ts                           # Complete theme system ⭐
│
├── types/                                  # TypeScript type definitions
│   └── index.ts                           # All app types ⭐
│
├── styles/                                 # StyleSheets
│   ├── feed.styles.ts                     # Feed screen styles
│   └── [other style files]
│
├── scripts/                                # Utility scripts (deprecated)
│   ├── seedFilters.ts                     # Old seeding approach
│   └── seedPosts.ts                       # Old post seeding
│
├── assets/                                 # Static assets
│   ├── images/
│   └── fonts/
│
├── .env.local                              # Environment variables
├── package.json                            # Dependencies
├── tsconfig.json                           # TypeScript config
├── app.json                               # Expo config
└── README.md                              # Project documentation

```

### Key Files by Purpose

| Purpose              | File Path                              | Description                                   |
| -------------------- | -------------------------------------- | --------------------------------------------- |
| **Main Feed Screen** | `app/(tabs)/index.tsx`                 | Home screen with filters, posts, career paths |
| **Filter UI**        | `components/FilterModal.tsx`           | Hierarchical filter modal component           |
| **Database Schema**  | `convex/schema.ts`                     | All table definitions                         |
| **Data Seeding**     | `convex/seedData.ts`                   | Populate filters and posts                    |
| **Filter Queries**   | `convex/filter.ts`                     | Backend queries for filter data               |
| **Post Operations**  | `convex/communityPosts.ts`             | Create, read, update, delete posts            |
| **Type Definitions** | `types/index.ts`                       | TypeScript interfaces                         |
| **Theme System**     | `constants/theme.ts`                   | Colors, typography, spacing                   |
| **Career Path Card** | `components/CareerPathDetails.tsx`     | Display career details                        |
| **Auth Setup**       | `providers/ClerkAndConvexProvider.tsx` | Authentication wrapper                        |

---

## Database Schema

### Tables Overview

```typescript
// convex/schema.ts

defineSchema({
  // 1. FilterOption - Hierarchical career paths
  FilterOption: defineTable({
    name: v.string(), // e.g., "React Developer"
    type: v.union(
      // Hierarchy level
      v.literal("qualification"), // Level 1
      v.literal("category"), // Level 2
      v.literal("sector"), // Level 3
      v.literal("subSector"), // Level 4
      v.literal("branch"), // Level 5
      v.literal("role") // Level 6
    ),
    parentId: v.optional(v.id("FilterOption")), // Parent in hierarchy

    // Rich content
    description: v.optional(v.string()),
    requirements: v.optional(v.string()),
    avgSalary: v.optional(v.string()),
    relevantExams: v.optional(v.string()),
    image: v.optional(v.string()),

    // Engagement
    likes: v.optional(v.number()),
    comments: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  }).index("by_parentId", ["parentId"]),

  // 2. CommunityPosts - Admin-created content
  communityPosts: defineTable({
    userId: v.id("users"), // Admin who created
    content: v.string(), // Post caption
    imageUrl: v.optional(v.string()),
    storageId: v.optional(v.id("_storage")),
    linkedFilterOptionIds: v.array(
      // Link to career paths
      v.id("FilterOption")
    ),

    // Engagement counters
    likes: v.number(),
    comments: v.number(),

    createdAt: v.number(),
    updatedAt: v.number(),
    isActive: v.optional(v.boolean()),
  })
    .index("by_created_at", ["createdAt"])
    .index("by_user", ["userId"])
    .index("by_linked_filter_option", [
      "linkedFilterOptionIds",
    ]),

  // 3. Users
  users: defineTable({
    username: v.optional(v.string()),
    fullname: v.optional(v.string()),
    email: v.optional(v.string()),
    bio: v.optional(v.string()),
    profileImage: v.optional(v.string()),
    clerkId: v.string(), // Clerk auth ID
    isAdmin: v.optional(v.boolean()), // Admin flag

    // Social (legacy)
    followers: v.optional(v.number()),
    following: v.optional(v.number()),
    posts: v.optional(v.number()),
  })
    .index("by_clerkId", ["clerkId"])
    .index("by_username", ["username"]),

  // 4. Comments - On posts OR career paths
  comments: defineTable({
    userId: v.id("users"),
    content: v.string(),
    parentCommentId: v.optional(v.id("comments")), // Nested comments
    communityPostId: v.optional(v.id("communityPosts")),
    filterOptionId: v.optional(v.id("FilterOption")),
    createdAt: v.number(),
  })
    .index("by_community_post", ["communityPostId"])
    .index("by_filter_option", ["filterOptionId"])
    .index("by_parent", ["parentCommentId"]),

  // 5. Likes - On posts OR career paths
  likes: defineTable({
    userId: v.id("users"),
    communityPostId: v.optional(v.id("communityPosts")),
    filterOptionId: v.optional(v.id("FilterOption")),
    createdAt: v.optional(v.number()),
  })
    .index("by_user_and_community_post", [
      "userId",
      "communityPostId",
    ])
    .index("by_user_and_filter_option", [
      "userId",
      "filterOptionId",
    ]),

  // 6. SavedContent - Bookmarks
  savedContent: defineTable({
    userId: v.id("users"),
    communityPostId: v.optional(v.id("communityPosts")),
    filterOptionId: v.optional(v.id("FilterOption")),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_community_post", [
      "userId",
      "communityPostId",
    ])
    .index("by_user_and_filter_option", [
      "userId",
      "filterOptionId",
    ]),

  // 7. Notifications
  notifications: defineTable({
    receiverId: v.id("users"),
    senderId: v.id("users"),
    type: v.union(
      v.literal("like"),
      v.literal("comment"),
      v.literal("follow")
    ),
    communityPostId: v.optional(v.id("communityPosts")),
    filterOptionId: v.optional(v.id("FilterOption")),
    commentId: v.optional(v.id("comments")),
    isRead: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_receiver", ["receiverId"])
    .index("by_receiver_and_read", [
      "receiverId",
      "isRead",
    ]),
});
```

### Hierarchy Example: Graduation → Defence → Navy → Executive Branch → Navy Pilot

```
FilterOption Documents:

1. {
     _id: "qualification_grad",
     name: "Graduation",
     type: "qualification",
     parentId: null,  // Root level
     description: "Bachelor's degree in any stream",
     isActive: true
   }

2. {
     _id: "category_govt",
     name: "Government Jobs",
     type: "category",
     parentId: "qualification_grad",
     description: "Central and state government positions",
     isActive: true
   }

3. {
     _id: "sector_defence",
     name: "Defence Services",
     type: "sector",
     parentId: "category_govt",
     description: "Join Indian Armed Forces and Paramilitary",
     avgSalary: "₹56,000 - ₹2,50,000/month",
     isActive: true
   }

4. {
     _id: "subsector_navy",
     name: "Indian Navy",
     type: "subSector",
     parentId: "sector_defence",
     description: "Naval forces protecting Indian waters",
     relevantExams: "INET, CDS, SSC",
     isActive: true
   }

5. {
     _id: "branch_executive",
     name: "Executive Branch",
     type: "branch",
     parentId: "subsector_navy",
     description: "Command and operational roles",
     requirements: "Graduation in any stream, Age 19-25",
     isActive: true
   }

6. {
     _id: "role_navy_pilot",
     name: "Navy Pilot",
     type: "role",
     parentId: "branch_executive",
     description: "Fly fighter jets, helicopters from carriers",
     requirements: "Physics & Math at 10+2 or B.E./B.Tech, Age 20-24",
     avgSalary: "₹56,100 - ₹1,77,500/month",
     relevantExams: "INET, SSB Interview",
     likes: 0,
     comments: 0,
     isActive: true
   }
```

---

## Key Features

### 1. Hierarchical Career Filter System ⭐

**6-Level Deep Filtering:**

```
Level 1: Qualification
  ├── 10th Standard
  ├── 12th Standard
  ├── Diploma
  └── Graduation

Level 2: Category (depends on qualification)
  ├── Government Jobs
  ├── Private Jobs
  ├── Business & Entrepreneurship
  ├── Sports & Fitness
  └── Agriculture & Allied

Level 3: Sector (e.g., under Government Jobs)
  ├── Defence Services
  ├── Banking & Finance
  ├── Railways
  ├── Civil Services
  ├── Teaching
  └── PSUs

Level 4: SubSector (e.g., under Defence)
  ├── Indian Army
  ├── Indian Navy
  ├── Indian Air Force
  └── Paramilitary Forces (CAPF)

Level 5: Branch (e.g., under Navy)
  ├── Executive Branch
  ├── Technical Branch
  └── Logistics Branch

Level 6: Role (e.g., under Executive)
  ├── Navy Pilot
  ├── SSC Officer
  └── Permanent Commission Officer
```

**Filter Features:**

- Breadcrumb navigation showing selected path
- Back button to go up one level
- Clear All to reset filters
- Prefetching next level for smooth UX
- In-memory caching to prevent UI flicker
- Apply button to activate filters

### 2. Dual Content Model

**A. Career Path Cards (Structured Data)**

- Displayed when user selects a specific filter
- Shows: Description, Requirements, Salary, Exams, Image
- Users can like, comment, save career paths
- Acts like a "career information hub"

**B. Community Posts (User-Generated Style)**

- Admin creates posts (articles, tips, guides)
- Linked to specific career paths via `linkedFilterOptionIds`
- Users can like, comment, save posts
- Image support
- Chronological feed

### 3. Admin-Only Posting

**Current Behavior:**

- Create tab exists but post creation should be restricted to admins
- Posts are created through seeding or manual admin creation
- Regular users can only: View, Like, Comment, Save

**Admin Identification:**

- `users.isAdmin` boolean flag in database
- Set manually in Convex dashboard or via seeding

### 4. Engagement Features

**On Community Posts:**

- ❤️ Like
- 💬 Comment (with nested replies)
- 🔖 Save/Bookmark
- Share (future)

**On Career Paths (FilterOptions):**

- ❤️ Like specific career paths
- 💬 Discuss career options in comments
- 🔖 Save career paths for reference

### 5. Real-Time Notifications

- Like notifications
- Comment notifications
- Follow notifications (when implemented)
- Mark as read/unread
- Notification badge counter

### 6. Theme System

**Dark & Light Modes:**

- Auto-detection of system preference
- Manual toggle in profile
- Persistent across sessions (AsyncStorage)
- Complete design token system

**Theme includes:**

- Primary, secondary, accent colors
- Typography scale (xs to 4xl)
- Spacing system (xs to 6xl)
- Border radius presets
- Shadow definitions
- Animation durations

### 7. User Profile

- Profile picture (from Google OAuth)
- Editable bio and fullname
- View user's comment history
- Logout functionality
- Stats (followers, following, posts) - legacy fields

### 8. Bookmarks

- Save career paths and posts
- Organized in separate tab
- Quick access to saved content
- Toggle save/unsave

---

## How to Add Posts

### Method 1: Database Seeding (Recommended for Bulk)

**File:** `convex/seedData.ts`

**Step-by-step:**

1. **Open `convex/seedData.ts`**

2. **Find or create the `seedCommunityPosts` mutation**

3. **Add your post to the seeding array:**

```typescript
// convex/seedData.ts

export const seedCommunityPosts = mutation({
  args: {},
  handler: async (ctx) => {
    // Get or create admin user
    const adminUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("isAdmin"), true))
      .first();

    if (!adminUser) {
      throw new Error(
        "Admin user not found. Create admin user first."
      );
    }

    // Clear existing posts (optional - remove if you want to keep old posts)
    const existingPosts = await ctx.db
      .query("communityPosts")
      .collect();
    for (const post of existingPosts) {
      await ctx.db.delete(post._id);
    }

    // EXAMPLE 1: Post about React Developer career
    // First, get the React Developer filter option ID
    const reactDeveloperFilter = await ctx.db
      .query("FilterOption")
      .filter((q) =>
        q.eq(q.field("name"), "React Developer")
      )
      .first();

    if (reactDeveloperFilter) {
      await ctx.db.insert("communityPosts", {
        userId: adminUser._id,
        content:
          "🚀 React Developer Roadmap 2026\n\nIf you're interested in becoming a React developer, here's your step-by-step guide:\n\n1. Master JavaScript ES6+ fundamentals\n2. Learn React basics (components, props, state)\n3. Understand React Hooks deeply\n4. Practice with Redux or Context API\n5. Build 3-5 portfolio projects\n6. Learn TypeScript\n7. Master Git & GitHub\n\nSalary range: ₹3-6 LPA for freshers, ₹6-15 LPA with experience.\n\nStart your journey today! 💪",
        imageUrl: "https://example.com/react-roadmap.jpg", // Optional
        linkedFilterOptionIds: [reactDeveloperFilter._id],
        likes: 0,
        comments: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isActive: true,
      });
    }

    // EXAMPLE 2: Post about Navy Pilot career
    const navyPilotFilter = await ctx.db
      .query("FilterOption")
      .filter((q) => q.eq(q.field("name"), "Navy Pilot"))
      .first();

    if (navyPilotFilter) {
      await ctx.db.insert("communityPosts", {
        userId: adminUser._id,
        content:
          "✈️ Life as a Navy Pilot: My Journey\n\nI've been flying MiG-29Ks from INS Vikramaditya for 5 years. Here's what you need to know:\n\n🎯 Entry: INET exam + SSB Interview\n📚 Training: 3 years at Naval Academy\n💰 Salary: ₹56,100/month (starting)\n🏆 Benefits: Free accommodation, medical, pension\n\n#NavyPilot #IndianNavy #DefenceCareer",
        linkedFilterOptionIds: [navyPilotFilter._id],
        likes: 0,
        comments: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isActive: true,
      });
    }

    // EXAMPLE 3: Post linked to MULTIPLE career paths
    const ibpsClerkFilter = await ctx.db
      .query("FilterOption")
      .filter((q) => q.eq(q.field("name"), "IBPS Clerk"))
      .first();

    const sbiPoFilter = await ctx.db
      .query("FilterOption")
      .filter((q) => q.eq(q.field("name"), "SBI PO"))
      .first();

    if (ibpsClerkFilter && sbiPoFilter) {
      await ctx.db.insert("communityPosts", {
        userId: adminUser._id,
        content:
          "🏦 Banking Exam Preparation Tips\n\nPreparing for IBPS Clerk or SBI PO? Here are my top tips:\n\n1. Start with NCERT books for basics\n2. Practice daily quant for 2 hours\n3. Read newspaper for current affairs\n4. Mock tests are CRUCIAL\n5. Time management is key\n\nAll the best! 🎯",
        linkedFilterOptionIds: [
          ibpsClerkFilter._id,
          sbiPoFilter._id,
        ],
        likes: 0,
        comments: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isActive: true,
      });
    }

    console.log("Community posts seeded successfully!");
  },
});
```

4. **Run the seeding mutation:**

```bash
# In terminal
npx convex run seedData:seedCommunityPosts
```

**Output:**

```
✓ Community posts seeded successfully!
```

---

### Method 2: Convex Dashboard (Manual One-by-One)

1. **Open Convex Dashboard:** https://dashboard.convex.dev
2. **Select your project**
3. **Go to "Data" tab**
4. **Click on `communityPosts` table**
5. **Click "Add Document"**
6. **Fill in the fields:**

```json
{
  "userId": "k123abc456...", // Get admin user ID from users table
  "content": "Your post content here with emojis 🚀",
  "imageUrl": "https://example.com/image.jpg", // Optional
  "linkedFilterOptionIds": ["k789def012..."], // Array of FilterOption IDs
  "likes": 0,
  "comments": 0,
  "createdAt": 1704067200000, // Use Date.now() value
  "updatedAt": 1704067200000,
  "isActive": true
}
```

7. **Click "Add Document"**

---

### Method 3: Programmatic via Mutation (Future Enhancement)

Create a mutation in `convex/communityPosts.ts`:

```typescript
// convex/communityPosts.ts

export const createCommunityPost = mutation({
  args: {
    content: v.string(),
    imageUrl: v.optional(v.string()),
    linkedFilterOptionIds: v.array(v.id("FilterOption")),
  },
  handler: async (ctx, args) => {
    // Get authenticated user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    // Get user from database
    const user = await ctx.db
      .query("users")
      .filter((q) =>
        q.eq(q.field("clerkId"), identity.subject)
      )
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Check if user is admin
    if (!user.isAdmin) {
      throw new Error("Only admins can create posts");
    }

    // Create post
    const postId = await ctx.db.insert("communityPosts", {
      userId: user._id,
      content: args.content,
      imageUrl: args.imageUrl,
      linkedFilterOptionIds: args.linkedFilterOptionIds,
      likes: 0,
      comments: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isActive: true,
    });

    return postId;
  },
});
```

**Usage in app:**

```typescript
// app/(tabs)/create.tsx

const createPost = useMutation(
  api.communityPosts.createCommunityPost
);

const handleShare = async () => {
  if (!caption.trim()) {
    alert("Please add a caption");
    return;
  }

  await createPost({
    content: caption,
    imageUrl: uploadedImageUrl, // If image was uploaded
    linkedFilterOptionIds: selectedFilters, // From filter selection
  });

  alert("Post created!");
  setCaption("");
};
```

---

### Post Content Best Practices

**Good Post Examples:**

```
1. Career Roadmap Post:
"🚀 Full Stack Developer Roadmap 2026

Frontend:
✅ HTML, CSS, JavaScript
✅ React.js or Vue.js
✅ Tailwind CSS

Backend:
✅ Node.js + Express
✅ MongoDB or PostgreSQL
✅ REST API design

DevOps Basics:
✅ Git & GitHub
✅ Docker basics
✅ Deploy on Vercel/Railway

💰 Salary: ₹4-8 LPA (Fresher)
📚 Timeline: 6-12 months of consistent learning

#FullStackDeveloper #WebDev"
```

```
2. Exam Preparation Post:
"📚 UPSC CSE Preparation Strategy

🎯 Prelims (200 marks each):
- GS Paper 1: Current affairs, Polity, Economy, Geography
- GS Paper 2: CSAT (Qualifying)

📖 Study Material:
- NCERT 6-12 (MUST read)
- Laxmikant (Polity)
- Ramesh Singh (Economy)
- The Hindu newspaper (daily)

⏰ Study Hours: 8-10 hours/day
💪 Attempt: Usually takes 2-3 attempts

Age Limit: 21-32 years
Salary: ₹56,100 - ₹2,50,000/month

Start early, stay consistent! 🔥"
```

```
3. Success Story Post:
"🏆 From 12th Pass to Sub-Inspector: My Story

I cleared SSC CPO 2024 and joined Delhi Police as SI.

My Journey:
📌 Completed 12th in 2021
📌 Started preparing in 2022
📌 Failed first attempt (2022)
📌 Cleared in second attempt (2024)

Key Tips:
1. Physical fitness is 50% of the game
2. Mock tests saved me in written exam
3. Interview preparation: Current affairs + confidence

Salary: ₹35,400 - ₹1,12,400/month

Never give up on your dreams! 💪

#SSC #CPO #SubInspector #Success"
```

---

## How to Add Filter Options

### Understanding Filter Hierarchy

Before adding filters, understand the 6-level hierarchy:

```
1. Qualification (Root)
   └── 2. Category
       └── 3. Sector
           └── 4. SubSector
               └── 5. Branch
                   └── 6. Role
```

**Each level must have a `parentId` pointing to its parent (except Level 1).**

---

### Method 1: Database Seeding (Recommended)

**File:** `convex/seedData.ts`

#### Example: Adding Complete "Defence After Graduation" Hierarchy

```typescript
// convex/seedData.ts

export const seedFilterOptions = mutation({
  args: {},
  handler: async (ctx) => {
    // Clear existing filters (optional)
    const existingFilters = await ctx.db
      .query("FilterOption")
      .collect();
    for (const filter of existingFilters) {
      await ctx.db.delete(filter._id);
    }

    // ==========================================
    // LEVEL 1: QUALIFICATIONS (Root)
    // ==========================================
    const graduation = await ctx.db.insert("FilterOption", {
      name: "Graduation",
      type: "qualification",
      parentId: null, // Root level
      description:
        "Bachelor's degree in any stream (Arts, Commerce, Science, Engineering)",
      isActive: true,
    });

    const twelfth = await ctx.db.insert("FilterOption", {
      name: "12th Standard",
      type: "qualification",
      parentId: null,
      description:
        "Higher Secondary Certificate (HSC) or 10+2",
      isActive: true,
    });

    const tenth = await ctx.db.insert("FilterOption", {
      name: "10th Standard",
      type: "qualification",
      parentId: null,
      description:
        "Secondary School Certificate (SSC) or Matriculation",
      isActive: true,
    });

    // ==========================================
    // LEVEL 2: CATEGORIES (Under Graduation)
    // ==========================================
    const govtJobs = await ctx.db.insert("FilterOption", {
      name: "Government Jobs",
      type: "category",
      parentId: graduation,
      description:
        "Central and State Government job opportunities with job security and benefits",
      isActive: true,
    });

    const privateJobs = await ctx.db.insert(
      "FilterOption",
      {
        name: "Private Jobs",
        type: "category",
        parentId: graduation,
        description:
          "Corporate sector opportunities in various industries",
        isActive: true,
      }
    );

    // ==========================================
    // LEVEL 3: SECTORS (Under Government Jobs)
    // ==========================================
    const defence = await ctx.db.insert("FilterOption", {
      name: "Defence Services",
      type: "sector",
      parentId: govtJobs,
      description:
        "Join Indian Armed Forces and Paramilitary to serve the nation",
      avgSalary: "₹56,100 - ₹2,50,000 per month",
      relevantExams: "CDS, AFCAT, INET, NDA",
      isActive: true,
    });

    const banking = await ctx.db.insert("FilterOption", {
      name: "Banking & Finance",
      type: "sector",
      parentId: govtJobs,
      description:
        "Government banks and financial institutions",
      avgSalary: "₹25,000 - ₹80,000 per month",
      relevantExams:
        "IBPS PO, IBPS Clerk, SBI PO, RBI Grade B",
      isActive: true,
    });

    // ==========================================
    // LEVEL 4: SUB-SECTORS (Under Defence)
    // ==========================================
    const indianArmy = await ctx.db.insert("FilterOption", {
      name: "Indian Army",
      type: "subSector",
      parentId: defence,
      description:
        "Land-based branch of Indian Armed Forces",
      requirements:
        "Graduation in any stream, Age 19-24 years",
      relevantExams:
        "CDS (Combined Defence Services), NDA, TES, TGC",
      isActive: true,
    });

    const indianNavy = await ctx.db.insert("FilterOption", {
      name: "Indian Navy",
      type: "subSector",
      parentId: defence,
      description:
        "Naval forces protecting Indian maritime interests",
      requirements:
        "Graduation (Technical: B.E./B.Tech, Non-Tech: Any degree)",
      relevantExams: "INET, CDS, SSC",
      avgSalary: "₹56,100 - ₹1,77,500 per month",
      isActive: true,
    });

    const indianAirForce = await ctx.db.insert(
      "FilterOption",
      {
        name: "Indian Air Force",
        type: "subSector",
        parentId: defence,
        description: "Aerial warfare and air defence",
        requirements:
          "Physics & Math at 10+2 for Flying, B.E./B.Tech for Technical",
        relevantExams: "AFCAT, CDS, NDA",
        isActive: true,
      }
    );

    const capf = await ctx.db.insert("FilterOption", {
      name: "Paramilitary Forces (CAPF)",
      type: "subSector",
      parentId: defence,
      description:
        "BSF, CRPF, CISF, ITBP, SSB under Ministry of Home Affairs",
      requirements:
        "Graduation in any stream, Age 20-25 years",
      relevantExams: "UPSC CAPF",
      avgSalary: "₹44,900 - ₹1,42,400 per month",
      isActive: true,
    });

    // ==========================================
    // LEVEL 5: BRANCHES (Under Indian Navy)
    // ==========================================
    const executiveBranch = await ctx.db.insert(
      "FilterOption",
      {
        name: "Executive Branch",
        type: "branch",
        parentId: indianNavy,
        description:
          "Command and operational roles including navigation, weapon systems",
        requirements:
          "Graduation in any stream, Age 19-25 years",
        isActive: true,
      }
    );

    const technicalBranch = await ctx.db.insert(
      "FilterOption",
      {
        name: "Technical Branch",
        type: "branch",
        parentId: indianNavy,
        description:
          "Engineering roles maintaining ships and aircraft",
        requirements:
          "B.E./B.Tech in Mechanical/Electrical/Electronics",
        isActive: true,
      }
    );

    const logisticsBranch = await ctx.db.insert(
      "FilterOption",
      {
        name: "Logistics Branch",
        type: "branch",
        parentId: indianNavy,
        description:
          "Supply chain, inventory, provisioning for naval operations",
        requirements: "Graduation in any stream",
        isActive: true,
      }
    );

    // ==========================================
    // LEVEL 6: ROLES (Under Executive Branch)
    // ==========================================
    await ctx.db.insert("FilterOption", {
      name: "Navy Pilot",
      type: "role",
      parentId: executiveBranch,
      description:
        "Fly fighter jets, helicopters, and maritime patrol aircraft from aircraft carriers and naval air stations",
      requirements:
        "Physics & Math at 10+2 or B.E./B.Tech, Age 20-24 years, Excellent physical fitness, 20/20 vision",
      avgSalary:
        "₹56,100 - ₹1,77,500 per month (+ Flying Allowance)",
      relevantExams:
        "INET (Indian Navy Entrance Test), SSB Interview (5 days)",
      image: "https://example.com/navy-pilot.jpg",
      likes: 0,
      comments: 0,
      isActive: true,
    });

    await ctx.db.insert("FilterOption", {
      name: "SSC Officer (Short Service)",
      type: "role",
      parentId: executiveBranch,
      description:
        "10-year commission with option to extend to permanent",
      requirements:
        "Graduation in any stream, Age 19-25 years",
      avgSalary: "₹56,100 - ₹1,42,400 per month",
      relevantExams: "Direct SSB or via CDS written exam",
      likes: 0,
      comments: 0,
      isActive: true,
    });

    await ctx.db.insert("FilterOption", {
      name: "Permanent Commission Officer",
      type: "role",
      parentId: executiveBranch,
      description:
        "Serve until retirement with full pension benefits",
      requirements:
        "Graduation, Age 19-25 years, Must clear CDS + SSB",
      avgSalary: "₹56,100 - ₹2,50,000 per month",
      relevantExams:
        "CDS (Combined Defence Services) by UPSC",
      likes: 0,
      comments: 0,
      isActive: true,
    });

    console.log("✅ Filter options seeded successfully!");
  },
});
```

**Run the seeding:**

```bash
npx convex run seedData:seedFilterOptions
```

---

### Method 2: Incremental Addition (Adding to Existing Hierarchy)

If you already have filters and want to add new ones:

```typescript
// Add new role under existing branch

export const addReactDeveloperRole = mutation({
  args: {},
  handler: async (ctx) => {
    // 1. Find the parent (Frontend Development branch)
    const frontendBranch = await ctx.db
      .query("FilterOption")
      .filter((q) =>
        q.eq(q.field("name"), "Frontend Development")
      )
      .first();

    if (!frontendBranch) {
      throw new Error(
        "Frontend Development branch not found"
      );
    }

    // 2. Insert new role
    await ctx.db.insert("FilterOption", {
      name: "React Developer",
      type: "role",
      parentId: frontendBranch._id,
      description:
        "Specializes in building dynamic, responsive user interfaces using React.js",
      requirements:
        "JavaScript (ES6+), React.js, Redux/Context API, HTML5, CSS3, Git, REST APIs",
      avgSalary:
        "Fresher: ₹3-6 LPA, Experienced: ₹6-15 LPA",
      relevantExams:
        "N/A (Portfolio & skills-based hiring)",
      likes: 0,
      comments: 0,
      isActive: true,
    });

    console.log("✅ React Developer role added!");
  },
});
```

**Run:**

```bash
npx convex run seedData:addReactDeveloperRole
```

---

### Method 3: Convex Dashboard (Manual)

1. **Open Convex Dashboard**
2. **Go to Data → FilterOption table**
3. **Click "Add Document"**
4. **IMPORTANT: Get Parent ID first**

   - Query the parent filter option
   - Copy its `_id` value

5. **Fill in the form:**

```json
{
  "name": "Python Developer",
  "type": "role",
  "parentId": "k123abc456...", // Parent's _id from Backend Development
  "description": "Build scalable backend systems using Python",
  "requirements": "Python, Django/Flask, PostgreSQL, REST APIs, Git",
  "avgSalary": "₹4-7 LPA (Fresher), ₹8-20 LPA (Experienced)",
  "relevantExams": "N/A",
  "likes": 0,
  "comments": 0,
  "isActive": true
}
```

6. **Click "Add Document"**

---

### Filter Template: Government Defence After Graduation

Here's a complete, copy-paste template for the entire Defence hierarchy:

```typescript
export const seedDefenceHierarchy = mutation({
  args: {},
  handler: async (ctx) => {
    // Get Graduation qualification
    const graduation = await ctx.db
      .query("FilterOption")
      .filter((q) =>
        q.and(
          q.eq(q.field("name"), "Graduation"),
          q.eq(q.field("type"), "qualification")
        )
      )
      .first();

    if (!graduation) {
      throw new Error(
        "Graduation qualification not found. Seed qualifications first."
      );
    }

    // Get Government Jobs category
    let govtJobs = await ctx.db
      .query("FilterOption")
      .filter((q) =>
        q.and(
          q.eq(q.field("name"), "Government Jobs"),
          q.eq(q.field("parentId"), graduation._id)
        )
      )
      .first();

    if (!govtJobs) {
      govtJobs = await ctx.db.insert("FilterOption", {
        name: "Government Jobs",
        type: "category",
        parentId: graduation._id,
        description:
          "Central and State Government positions",
        isActive: true,
      });
    }

    // Defence Services Sector
    const defence = await ctx.db.insert("FilterOption", {
      name: "Defence & Paramilitary",
      type: "sector",
      parentId: govtJobs._id,
      description:
        "Indian Armed Forces and Central Armed Police Forces",
      avgSalary: "₹56,000 - ₹2,50,000 per month",
      isActive: true,
    });

    // SUB-SECTORS
    const army = await ctx.db.insert("FilterOption", {
      name: "Indian Army",
      type: "subSector",
      parentId: defence._id,
      description: "Land warfare force",
      relevantExams: "CDS, TES, TGC",
      isActive: true,
    });

    const navy = await ctx.db.insert("FilterOption", {
      name: "Indian Navy",
      type: "subSector",
      parentId: defence._id,
      description: "Naval warfare force",
      relevantExams: "INET, CDS",
      isActive: true,
    });

    const airforce = await ctx.db.insert("FilterOption", {
      name: "Indian Air Force",
      type: "subSector",
      parentId: defence._id,
      description: "Aerial warfare force",
      relevantExams: "AFCAT, CDS",
      isActive: true,
    });

    const capf = await ctx.db.insert("FilterOption", {
      name: "CAPF (Paramilitary)",
      type: "subSector",
      parentId: defence._id,
      description: "BSF, CRPF, CISF, ITBP, SSB",
      relevantExams: "UPSC CAPF AC",
      isActive: true,
    });

    // ARMY BRANCHES
    const armyIMA = await ctx.db.insert("FilterOption", {
      name: "IMA (Indian Military Academy)",
      type: "branch",
      parentId: army._id,
      description: "Officer training for Army",
      requirements: "Any graduation, Age 19-24",
      isActive: true,
    });

    const armyOTA = await ctx.db.insert("FilterOption", {
      name: "OTA (Officers Training Academy)",
      type: "branch",
      parentId: army._id,
      description: "SSC officer training",
      requirements: "Any graduation, Age 19-25",
      isActive: true,
    });

    const armyJAG = await ctx.db.insert("FilterOption", {
      name: "JAG (Law Officers)",
      type: "branch",
      parentId: army._id,
      description: "Legal wing of Army",
      requirements: "LLB with 55% marks, Age 21-27",
      isActive: true,
    });

    // NAVY BRANCHES
    const navyExecutive = await ctx.db.insert(
      "FilterOption",
      {
        name: "Executive Branch",
        type: "branch",
        parentId: navy._id,
        description: "Command and operational roles",
        isActive: true,
      }
    );

    const navyTechnical = await ctx.db.insert(
      "FilterOption",
      {
        name: "Technical Branch",
        type: "branch",
        parentId: navy._id,
        description: "Engineering maintenance",
        requirements: "B.E./B.Tech",
        isActive: true,
      }
    );

    const navyLogistics = await ctx.db.insert(
      "FilterOption",
      {
        name: "Logistics Branch",
        type: "branch",
        parentId: navy._id,
        description: "Supply chain and inventory",
        isActive: true,
      }
    );

    // AIR FORCE BRANCHES
    const afFlying = await ctx.db.insert("FilterOption", {
      name: "Flying Branch",
      type: "branch",
      parentId: airforce._id,
      description: "Pilot and navigator roles",
      requirements:
        "Physics & Math at 10+2 or B.E./B.Tech, Age 20-24",
      isActive: true,
    });

    const afGroundTech = await ctx.db.insert(
      "FilterOption",
      {
        name: "Ground Duty (Technical)",
        type: "branch",
        parentId: airforce._id,
        description: "Engineering roles",
        requirements: "B.E./B.Tech, Age 20-26",
        isActive: true,
      }
    );

    const afGroundNonTech = await ctx.db.insert(
      "FilterOption",
      {
        name: "Ground Duty (Non-Technical)",
        type: "branch",
        parentId: airforce._id,
        description: "Administration, logistics, accounts",
        requirements: "Any graduation, Age 20-26",
        isActive: true,
      }
    );

    // CAPF BRANCHES
    const capfBSF = await ctx.db.insert("FilterOption", {
      name: "BSF - Border Security Force",
      type: "branch",
      parentId: capf._id,
      description: "Guards India's borders",
      isActive: true,
    });

    const capfCRPF = await ctx.db.insert("FilterOption", {
      name: "CRPF - Central Reserve Police Force",
      type: "branch",
      parentId: capf._id,
      description: "Internal security",
      isActive: true,
    });

    const capfCISF = await ctx.db.insert("FilterOption", {
      name: "CISF - Central Industrial Security Force",
      type: "branch",
      parentId: capf._id,
      description: "Secures vital installations",
      isActive: true,
    });

    const capfITBP = await ctx.db.insert("FilterOption", {
      name: "ITBP - Indo-Tibetan Border Police",
      type: "branch",
      parentId: capf._id,
      description: "Guards Himalayan borders",
      isActive: true,
    });

    const capfSSB = await ctx.db.insert("FilterOption", {
      name: "SSB - Sashastra Seema Bal",
      type: "branch",
      parentId: capf._id,
      description: "Guards Nepal & Bhutan borders",
      isActive: true,
    });

    // ROLES (Examples under Navy Executive Branch)
    await ctx.db.insert("FilterOption", {
      name: "Navy Pilot",
      type: "role",
      parentId: navyExecutive._id,
      description:
        "Fly fighter jets, helicopters from aircraft carriers",
      requirements:
        "Physics & Math at 10+2 or B.E./B.Tech, Age 20-24, Medical fit",
      avgSalary:
        "₹56,100 - ₹1,77,500/month + Flying Allowance",
      relevantExams: "INET, SSB Interview",
      isActive: true,
    });

    await ctx.db.insert("FilterOption", {
      name: "SSC Officer (Navy)",
      type: "role",
      parentId: navyExecutive._id,
      description: "10-year Short Service Commission",
      requirements: "Any graduation, Age 19-25",
      avgSalary: "₹56,100 - ₹1,42,400/month",
      relevantExams: "SSB Interview",
      isActive: true,
    });

    // ROLES under Air Force Flying Branch
    await ctx.db.insert("FilterOption", {
      name: "Fighter Pilot",
      type: "role",
      parentId: afFlying._id,
      description: "Fly Sukhoi, MiG, Rafale fighter jets",
      requirements:
        "Physics & Math at 10+2, Age 20-24, Height 162.5-190cm",
      avgSalary:
        "₹56,100 - ₹1,77,500/month + Flying Allowance",
      relevantExams: "AFCAT, NDA, SSB",
      isActive: true,
    });

    await ctx.db.insert("FilterOption", {
      name: "Transport Pilot",
      type: "role",
      parentId: afFlying._id,
      description: "Fly C-130, C-17 transport aircraft",
      requirements: "Physics & Math at 10+2, Age 20-24",
      avgSalary: "₹56,100 - ₹1,77,500/month",
      relevantExams: "AFCAT, NDA",
      isActive: true,
    });

    // ROLES under CAPF
    await ctx.db.insert("FilterOption", {
      name: "Assistant Commandant",
      type: "role",
      parentId: capfBSF._id,
      description: "Officer rank in BSF via UPSC",
      requirements: "Any graduation, Age 20-25",
      avgSalary: "₹44,900 - ₹1,42,400/month",
      relevantExams:
        "UPSC CAPF AC Exam + Physical + Interview",
      isActive: true,
    });

    console.log("✅ Complete Defence hierarchy seeded!");
  },
});
```

**Run:**

```bash
npx convex run seedData:seedDefenceHierarchy
```

---

## Filter System Deep Dive

### How FilterModal Works

**File:** `components/FilterModal.tsx`

**Key Features:**

1. **Hierarchical Navigation**: Displays child options based on current parent
2. **Breadcrumb Trail**: Shows path like "Graduation > Govt Jobs > Defence"
3. **Caching**: Prevents UI flicker by caching queries
4. **Prefetching**: Loads next level ahead of time for smooth UX

**State Management:**

```typescript
const [selectedPath, setSelectedPath] = useState<
  Id<"FilterOption">[]
>([]);
const [currentLevel, setCurrentLevel] = useState(0);

// selectedPath = [graduation_id, govtJobs_id, defence_id]
// currentLevel = 3 (showing Defence's children)
```

**Query Flow:**

```typescript
// Get children of current parent
const filterOptions = useQuery(
  api.filter.getFilterChildren,
  currentParentId
    ? { parentId: currentParentId }
    : { parentId: null }
);
```

**Breadcrumb Display:**

```typescript
const filterNames = useQuery(
  api.filter.getFilterNamesByIds,
  selectedPath.length > 0 ? { ids: selectedPath } : "skip"
);

// Returns: ["Graduation", "Government Jobs", "Defence Services"]
```

---

### Backend Query Logic

**File:** `convex/filter.ts`

```typescript
// 1. Get children of a parent (or root if no parent)
export const getFilterChildren = query({
  args: {
    parentId: v.optional(v.id("FilterOption")),
  },
  handler: async (ctx, args) => {
    if (args.parentId === undefined) {
      // Get root level (qualifications)
      return await ctx.db
        .query("FilterOption")
        .filter((q) => q.eq(q.field("parentId"), null))
        .filter((q) => q.eq(q.field("isActive"), true))
        .collect();
    } else {
      // Get children of specific parent
      return await ctx.db
        .query("FilterOption")
        .withIndex("by_parentId", (q) =>
          q.eq("parentId", args.parentId)
        )
        .filter((q) => q.eq(q.field("isActive"), true))
        .collect();
    }
  },
});

// 2. Get filter option details by ID (for career path card)
export const getFilterOptionById = query({
  args: { id: v.id("FilterOption") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// 3. Get names for breadcrumb
export const getFilterNamesByIds = query({
  args: { ids: v.array(v.id("FilterOption")) },
  handler: async (ctx, args) => {
    const filters = await Promise.all(
      args.ids.map((id) => ctx.db.get(id))
    );
    return filters
      .filter((f) => f !== null)
      .map((f) => f!.name);
  },
});
```

---

### Integration in Feed Screen

**File:** `app/(tabs)/index.tsx`

**Dual Mode Display:**

```typescript
const [selectedFilters, setSelectedFilters] = useState<Id<"FilterOption">[]>([]);

// Mode 1: No filters selected → Show all posts
const communityPosts = useQuery(api.communityPosts.getCommunityPosts);

// Mode 2: Filter selected → Show career path card + related posts
const selectedCareerPath = useQuery(
  api.filter.getFilterOptionById,
  selectedFilters.length > 0
    ? { id: selectedFilters[selectedFilters.length - 1] }
    : "skip"
);

return (
  <View>
    {/* Filter button */}
    <FilterModal
      visible={filterModalVisible}
      onClose={() => setFilterModalVisible(false)}
      selectedFilters={selectedFilters}
      onFiltersChange={setSelectedFilters}
    />

    {/* Show career path card if filter selected */}
    {selectedCareerPath && (
      <CareerPathDetails careerPath={selectedCareerPath} />
    )}

    {/* Show community posts */}
    <FlatList
      data={communityPosts}
      renderItem={({ item }) => <CommunityPost post={item} />}
    />
  </View>
);
```

---

## API Reference

### Filter Queries

| Endpoint                     | Type  | Args                | Returns                |
| ---------------------------- | ----- | ------------------- | ---------------------- |
| `filter.getFilterChildren`   | Query | `{ parentId?: Id }` | `FilterOption[]`       |
| `filter.getAllFilterOptions` | Query | None                | `FilterOption[]`       |
| `filter.getFilterOptionById` | Query | `{ id: Id }`        | `FilterOption \| null` |
| `filter.getFilterNamesByIds` | Query | `{ ids: Id[] }`     | `string[]`             |

### Community Post Queries/Mutations

| Endpoint                                         | Type     | Args                                            | Returns                    |
| ------------------------------------------------ | -------- | ----------------------------------------------- | -------------------------- |
| `communityPosts.getCommunityPosts`               | Query    | None                                            | `CommunityPost[]` (max 20) |
| `communityPosts.getCommunityPostById`            | Query    | `{ id: Id }`                                    | `CommunityPost`            |
| `communityPosts.getCommunityPostsByFilterOption` | Query    | `{ filterOptionId: Id }`                        | `CommunityPost[]`          |
| `communityPosts.getCommunityPostsByUser`         | Query    | `{ userId: Id }`                                | `CommunityPost[]`          |
| `communityPosts.createCommunityPost`             | Mutation | `{ content, imageUrl?, linkedFilterOptionIds }` | `Id`                       |
| `communityPosts.deleteCommunityPost`             | Mutation | `{ id: Id }`                                    | `void`                     |

### Comment Queries/Mutations

| Endpoint               | Type     | Args                                                               | Returns     |
| ---------------------- | -------- | ------------------------------------------------------------------ | ----------- |
| `comments.getComments` | Query    | `{ communityPostId?: Id, filterOptionId?: Id }`                    | `Comment[]` |
| `comments.addComment`  | Mutation | `{ content, communityPostId?, filterOptionId?, parentCommentId? }` | `Id`        |

### Saved Content Mutations

| Endpoint                       | Type     | Args                                            | Returns          |
| ------------------------------ | -------- | ----------------------------------------------- | ---------------- |
| `savedContent.toggleSave`      | Mutation | `{ communityPostId?: Id, filterOptionId?: Id }` | `boolean`        |
| `savedContent.getIsSaved`      | Query    | `{ communityPostId?: Id, filterOptionId?: Id }` | `boolean`        |
| `savedContent.getSavedContent` | Query    | None                                            | `SavedContent[]` |

### User Queries/Mutations

| Endpoint                 | Type     | Args                                                   | Returns |
| ------------------------ | -------- | ------------------------------------------------------ | ------- |
| `users.getUserById`      | Query    | `{ userId: Id }`                                       | `User`  |
| `users.getUserByClerkId` | Query    | `{ clerkId: string }`                                  | `User`  |
| `users.createUser`       | Mutation | `{ email, username, fullname, profileImage, clerkId }` | `Id`    |
| `users.updateUser`       | Mutation | `{ bio?, fullname? }`                                  | `void`  |

---

## User Flows

### Flow 1: First-Time User Onboarding

```
1. User downloads app from Play Store
   ↓
2. Opens app → Sees login screen
   ↓
3. Taps "Continue with Google"
   ↓
4. Google OAuth flow (Clerk)
   ↓
5. User authenticated → Profile created in Convex
   ↓
6. Redirected to Home (Feed) screen
   ↓
7. Sees all community posts (no filter applied)
   ↓
8. Explores posts by scrolling
```

### Flow 2: Discovering Career Path via Filter

```
1. User on Home screen
   ↓
2. Taps "Filter" button (floating action button)
   ↓
3. FilterModal opens
   ↓
4. Level 1: Selects "Graduation"
   ↓
5. Level 2: Sees categories → Selects "Government Jobs"
   ↓
6. Level 3: Sees sectors → Selects "Defence Services"
   ↓
7. Level 4: Sees branches → Selects "Indian Navy"
   ↓
8. Level 5: Sees sub-branches → Selects "Executive Branch"
   ↓
9. Level 6: Sees roles → Selects "Navy Pilot"
   ↓
10. Taps "Apply Filters"
    ↓
11. Modal closes
    ↓
12. Home screen now shows:
    - Breadcrumb: "Graduation > Govt Jobs > Defence > Navy > Executive > Navy Pilot"
    - Career Path Card with full details
    - Related community posts tagged with this path
    ↓
13. User reads career details, salary, exam info
    ↓
14. Taps "Save" icon to bookmark this career
    ↓
15. Reads admin posts about Navy Pilot life
    ↓
16. Likes posts, adds comments asking questions
```

### Flow 3: Admin Creating Post

```
1. Admin logs in (has isAdmin: true flag)
   ↓
2. Goes to "Create" tab
   ↓
3. Writes post content:
   "🚀 How to prepare for INET exam for Navy Pilot..."
   ↓
4. Optionally uploads image
   ↓
5. Selects linked filter:
   - Finds "Navy Pilot" filter option
   - Links post to it
   ↓
6. Taps "Share"
   ↓
7. Post created with linkedFilterOptionIds = [navyPilot_id]
   ↓
8. Post appears in:
   - Global feed (Home with no filters)
   - Filtered feed when user selects "Navy Pilot" path
```

### Flow 4: User Engaging with Content

```
1. User sees interesting post about React Developer roadmap
   ↓
2. Taps ❤️ Like button
   ↓
3. Like count increments
   ↓
4. Admin (post creator) gets notification
   ↓
5. User taps comment icon
   ↓
6. Writes comment: "Thanks! This roadmap is super helpful"
   ↓
7. Comment posted
   ↓
8. Admin gets notification about comment
   ↓
9. User taps Save icon
   ↓
10. Post added to Bookmarks tab
    ↓
11. Later, user opens Bookmarks tab
    ↓
12. Sees all saved posts and career paths
```

---

## Future Enhancements

### Phase 1: Core Improvements

1. **Implement Likes Functionality**

   - Complete backend in `convex/likes.ts`
   - Enable like/unlike on posts and career paths
   - Show like count in real-time

2. **Search Feature**

   - Search posts by keywords
   - Search career paths by name
   - Search by exam name (e.g., "UPSC", "AFCAT")

3. **Post Creation with Filter Linking**

   - Allow admins to select filters while creating posts in the app
   - Multi-select filter options
   - Preview linked career paths before posting

4. **Comment Reply UI**

   - Nested comment threads
   - Reply button on each comment
   - Indent nested replies

5. **Push Notifications**
   - Expo push notifications
   - Notify on new likes, comments
   - Daily digest of new posts in saved career paths

### Phase 2: Advanced Features

6. **User Career Journey Tracking**

   - User selects their current qualification
   - App suggests relevant career paths
   - Track progress: "Preparing for UPSC", "Appeared for AFCAT"

7. **Exam Calendar**

   - Show upcoming exam dates
   - Reminders for application deadlines
   - Link to official exam websites

8. **Success Stories**

   - Dedicated section for user success stories
   - "I cleared UPSC" posts
   - Filter by career path

9. **Career Path Comparison**

   - Compare 2-3 career options side by side
   - Salary, requirements, difficulty, job availability

10. **Regional Language Support**
    - Hindi, Tamil, Telugu, Marathi, Bengali
    - Localized career path descriptions
    - OCR for regional language posts

### Phase 3: Community Features

11. **Q&A Section**

    - Dedicated questions tab
    - Users ask career-related doubts
    - Community answers (upvote/downvote)
    - Mark accepted answer

12. **Mentorship Matching**

    - Connect users with mentors in their desired field
    - Chat functionality
    - Video call integration

13. **Study Groups**

    - Create groups for specific exams (UPSC, AFCAT, GATE)
    - Share resources, notes
    - Group challenges and leaderboards

14. **Career Assessment Quiz**

    - Personality-based career suggestions
    - Interest inventory
    - Skill assessment tests

15. **Job Alerts Integration**
    - Scrape government job portals
    - Notify users when relevant job notification drops
    - Direct links to application forms

### Phase 4: Monetization & Scale

16. **Premium Courses**

    - Partner with coaching institutes
    - Sell exam prep courses within app
    - Revenue sharing model

17. **Sponsored Career Paths**

    - Companies sponsor specific career paths
    - Featured placements for private jobs

18. **Analytics Dashboard for Admins**

    - Most viewed career paths
    - Engagement metrics per post
    - User demographics (age, location, qualification)

19. **AI-Powered Recommendations**

    - ML model to suggest career paths based on user behavior
    - "Users similar to you also viewed..."

20. **Offline Mode**
    - Download posts for offline reading
    - Sync when back online

---

## Development Workflow

### Running the App

```bash
# Install dependencies
npm install

# Start Convex backend
npx convex dev

# Start Expo development server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios

# Run on Web
npm run web
```

### Seeding Data

```bash
# Seed filter options
npx convex run seedData:seedFilterOptions

# Seed community posts
npx convex run seedData:seedCommunityPosts

# Alternative: Run both
npx convex run seedData:seedAll  # If you create this wrapper
```

### Environment Variables

Create `.env.local`:

```
EXPO_PUBLIC_CONVEX_URL=https://your-project.convex.cloud
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
```

### Building for Production

```bash
# Android APK
eas build --platform android

# iOS IPA
eas build --platform ios

# Submit to Google Play
eas submit --platform android

# Submit to App Store
eas submit --platform ios
```

---

## Testing Strategy

### Manual Testing Checklist

**Authentication:**

- [ ] Login with Google works
- [ ] User profile created in Convex
- [ ] Logout clears session
- [ ] Profile image synced from Google

**Filter System:**

- [ ] Root qualifications load
- [ ] Drilling down shows correct children
- [ ] Breadcrumb displays full path
- [ ] Back button works correctly
- [ ] Clear All resets to root
- [ ] Apply Filters closes modal and updates feed

**Feed Display:**

- [ ] Posts load on home screen
- [ ] Pull-to-refresh updates posts
- [ ] Filtered mode shows career path card
- [ ] Related posts display correctly
- [ ] Infinite scroll works (if implemented)

**Engagement:**

- [ ] Like button increments count
- [ ] Comment submission works
- [ ] Comments display under posts
- [ ] Save/Unsave toggles correctly
- [ ] Saved content shows in Bookmarks tab

**Admin Features:**

- [ ] Only admins can create posts
- [ ] Post creation links to filters
- [ ] Image upload works
- [ ] Post appears in feed immediately

**Edge Cases:**

- [ ] Empty states (no posts, no saved content)
- [ ] Loading states show spinners
- [ ] Error handling (network failures)
- [ ] Long text truncation
- [ ] Image load failures show placeholder

---

## Troubleshooting

### Common Issues

**1. "Cannot find module 'convex'"**

```bash
npm install convex
npx convex dev
```

**2. Authentication failing**

- Check Clerk publishable key in `.env.local`
- Verify Clerk dashboard has correct OAuth settings
- Clear app data and re-login

**3. Filters not loading**

- Run seeding: `npx convex run seedData:seedFilterOptions`
- Check Convex dashboard for FilterOption documents
- Verify `isActive: true` on filter options

**4. Posts not showing**

- Seed posts: `npx convex run seedData:seedCommunityPosts`
- Check if admin user exists
- Verify `linkedFilterOptionIds` are valid

**5. "User not found" errors**

- Clear Convex database
- Re-seed filters and posts
- Delete and reinstall app

---

## Support & Resources

### Documentation

- **Expo**: https://docs.expo.dev
- **Convex**: https://docs.convex.dev
- **Clerk**: https://clerk.com/docs
- **React Native**: https://reactnative.dev

### Community

- GitHub Issues: (Add your repo link)
- Discord: (Add community link)
- Email: support@skillsapp.in

---

**Last Updated:** 2026-01-11
**Version:** 1.0.0
**Author:** SkillsApp Team
