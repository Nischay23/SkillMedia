# SkillMedia - Phased Development Guide

> A comprehensive, phase-by-phase development plan for building the SkillMedia career discovery platform. Each phase includes feature checklists, schema changes, component lists, admin panel requirements, AI prompts for developers, and testing checklists.

---

## How to Use This Document

1. **Read the phase overview** to understand what you're building and why
2. **Check prerequisites** to make sure the previous phase is complete
3. **Copy the AI Prompt** section into Claude/ChatGPT to generate the code for that phase
4. **Follow the Testing Checklist** after building to verify everything works
5. **Mark items complete** in the Feature Checklist as you go
6. Build phases **in order** — each phase depends on the previous one

---

## Tech Stack

| Layer          | Technology                                                         |
| -------------- | ------------------------------------------------------------------ |
| Mobile App     | React Native 0.79.5 + Expo 53 (Expo Router for file-based routing) |
| Backend        | Convex (real-time, serverless)                                     |
| Authentication | Clerk (Google OAuth)                                               |
| Animations     | React Native Reanimated 3.17                                       |
| Modals         | @gorhom/bottom-sheet                                               |
| Gradients      | expo-linear-gradient                                               |
| Images         | expo-image                                                         |
| Admin Panel    | Next.js (separate app in `/admin-dashboard`)                       |
| AI             | Google Gemini (`@google/genai` — key in `.env`)                    |

---

## Project Structure

```
skillmedia/
├── app/                          # Expo Router screens
│   ├── (auth)/login.tsx          # Login screen
│   ├── (tabs)/                   # Tab navigation
│   │   ├── _layout.tsx           # Tab bar config
│   │   ├── index.tsx             # Feed (Explore)
│   │   ├── bookmarks.tsx         # Saved items
│   │   ├── notifications.tsx     # Notifications
│   │   └── profile.tsx           # User profile
│   ├── user/[id].tsx             # User profile deep link
│   ├── _layout.tsx               # Root layout (providers)
│   └── index.tsx                 # Root redirect
├── components/                   # Shared components
│   ├── cards/                    # Card components
│   ├── ui/                       # UI library (Typography, Button, etc.)
│   ├── FilterModal.tsx           # Filter wizard
│   ├── CommunityPost.tsx         # Post display
│   ├── CommentsModal.tsx         # Comments
│   └── ...
├── constants/                    # Theme, colors, typography
├── convex/                       # Backend functions & schema
├── providers/                    # ClerkAndConvexProvider, ThemeProvider
├── styles/                       # Centralized style files
├── types/                        # TypeScript definitions
├── admin-dashboard/              # Next.js admin panel
│   ├── app/admin/                # Admin routes (filters, posts)
│   └── components/admin/         # Admin components
└── docs/                         # This file
```

---

## Current Database Schema (Convex)

```
users           → username, fullname, email, bio, profileImage, clerkId, isAdmin
FilterOption    → name, type, parentId, description, requirements, avgSalary, relevantExams, image, likes, comments, isActive
communityPosts  → userId, title, content, imageUrl, linkedFilterOptionIds, status, likes, comments, createdAt
likes           → userId, communityPostId?, filterOptionId?
comments        → userId, content, communityPostId?, filterOptionId?, parentCommentId?
notifications   → receiverId, senderId, type, communityPostId?, isRead
savedContent    → userId, communityPostId?, filterOptionId?
```

---

## What's Already Built

- [x] User authentication (Google OAuth via Clerk)
- [x] Hierarchical filter system (6 levels: qualification → category → sector → subSector → branch → role)
- [x] Filter wizard UI with breadcrumbs and progress bar
- [x] Career Path Cards display (admin-created via admin panel)
- [x] Instagram-style feed with filter integration
- [x] Like/Comment/Save functionality on cards and posts
- [x] Community posts (user-generated content linked to career paths)
- [x] User profiles with edit capability
- [x] Notifications system (basic — like, comment, follow)
- [x] Bookmarks/saved content screen
- [x] Dark/light theme toggle with persistence
- [x] Skeleton loading states
- [x] Pull-to-refresh with career facts
- [x] Admin Panel (Next.js) — filter tree management + post creation
- [x] Database seeding tools

---

---

# PHASE 1A: Complete Foundation

> **Goal:** Finish all remaining Phase 1 features from the PRD before moving to community features.

## Overview

The core discovery experience is 80% complete. This phase fills the gaps: share functionality, ranking badges, annual vacancy data, admin articles on career cards, and an improved card detail view. This makes each career card a complete, self-contained information unit before we start building groups around them.

## Prerequisites

- Current codebase is functional (auth, feed, filters, cards all working)
- Admin panel is accessible for content management
- At least 10-15 career cards exist in the database

## Feature Checklist

### Mobile App

- [x] **Share functionality** — Share career cards via WhatsApp, Telegram, other apps using `expo-sharing` and deep links via `expo-linking`
- [ ] **Ranking badge** — Show ranking position badge (e.g., "#1", "#2") on career cards in the feed and filter results
- [ ] **Annual vacancies display** — Show annual vacancy count on career path cards
- [ ] **Improved card detail view** — Structured sections for: Description, Requirements (as bullet list), Salary Range (min-max with fresher/experienced), Relevant Exams (name + frequency + eligibility), and Admin Articles
- [ ] **Admin articles section** — Display admin-posted articles/tips within the career card detail view
- [ ] **Career card sorting** — Sort career cards by ranking within the same filter level

### Admin Panel

- [ ] **Ranking field** — Add numeric ranking input when creating/editing filter options
- [ ] **Annual vacancies field** — Add annual vacancies number input on career card creation/edit
- [ ] **Admin articles editor** — CRUD interface for admin articles linked to career paths (title, content, rich text)
- [ ] **Card preview** — Preview how a career card will look in the mobile app before publishing
- [ ] **Engagement dashboard** — Show likes, comments, saves count per career card in the admin panel
- [ ] **Bulk operations** — Select multiple filter options and update ranking, status, etc.

### Content

- [ ] **Seed 50+ career cards** — Cover all 5 qualification levels with major categories populated

## Schema Changes (Convex)

### Modify `FilterOption` table — add fields:

```typescript
ranking: v.optional(v.number()),           // Position by job demand (1 = highest)
annualVacancies: v.optional(v.number()),   // Approximate openings per year
```

### New table: `adminArticles`

```typescript
adminArticles: defineTable({
  filterOptionId: v.id("FilterOption"), // Which career path this belongs to
  title: v.string(), // Article title
  content: v.string(), // Article body (rich text/markdown)
  authorId: v.id("users"), // Admin who wrote it
  order: v.optional(v.number()), // Display order
  isPublished: v.boolean(),
  createdAt: v.number(),
  updatedAt: v.number(),
}).index("by_filter_option", ["filterOptionId"]);
```

## New/Modified Files

### Mobile App

| File                                      | Action | What                                                                  |
| ----------------------------------------- | ------ | --------------------------------------------------------------------- |
| `components/cards/CareerPathHeroCard.tsx` | Modify | Add ranking badge, annual vacancies display                           |
| `components/CareerPathDetails.tsx`        | Modify | Add structured sections (requirements, salary, exams, admin articles) |
| `components/ShareButton.tsx`              | Create | Reusable share button using expo-sharing                              |
| `components/RankingBadge.tsx`             | Create | Ranking position badge component                                      |
| `convex/filter.ts`                        | Modify | Add sorting by ranking, return ranking/vacancy fields                 |
| `convex/adminArticles.ts`                 | Create | CRUD queries/mutations for admin articles                             |

### Admin Panel

| File                                                  | Action | What                               |
| ----------------------------------------------------- | ------ | ---------------------------------- |
| `admin-dashboard/components/admin/AddFilterModal.tsx` | Modify | Add ranking + vacancies fields     |
| `admin-dashboard/app/admin/articles/page.tsx`         | Create | Admin articles management page     |
| `admin-dashboard/components/admin/ArticleEditor.tsx`  | Create | Rich text article editor component |
| `admin-dashboard/app/admin/page.tsx`                  | Modify | Add engagement stats dashboard     |

## Backend Functions (Convex)

### New functions:

```
convex/adminArticles.ts:
  - getArticlesByFilterOption(filterOptionId) → query
  - createArticle(filterOptionId, title, content) → mutation
  - updateArticle(articleId, title, content) → mutation
  - deleteArticle(articleId) → mutation

convex/filter.ts (modify existing):
  - getFilterChildren() → add sorting by ranking field
  - getFilterOptionById() → include ranking, annualVacancies in response
```

## AI Prompt for Developer

```
You are building features for the SkillMedia Expo mobile app — a career discovery platform for Indian students.

PROJECT CONTEXT:
- Tech stack: React Native 0.79.5, Expo 53, Expo Router (file-based routing), Convex (backend), Clerk (auth)
- The project is at its root directory with the structure: app/ (screens), components/ (shared), convex/ (backend), constants/ (theme), admin-dashboard/ (Next.js admin panel)
- Theme system exists in constants/theme.ts and constants/Colors.ts — always use useTheme() hook for colors
- UI components library exists at components/ui/ — use Typography, AnimatedButton, AnimatedCard, GlassCard, etc.
- Animations use react-native-reanimated — follow existing patterns in the codebase
- Bottom sheets use @gorhom/bottom-sheet

EXISTING DATABASE (convex/schema.ts):
- FilterOption table has: name, type (qualification|category|sector|subSector|branch|role), parentId, description, requirements, avgSalary, relevantExams, image, likes, comments, isActive
- communityPosts, likes, comments, notifications, savedContent tables exist

TASK — Complete these Phase 1A features:

1. SCHEMA CHANGES (convex/schema.ts):
   - Add to FilterOption: ranking (optional number), annualVacancies (optional number)
   - Create new table "adminArticles" with fields: filterOptionId (id ref to FilterOption), title (string), content (string), authorId (id ref to users), order (optional number), isPublished (boolean), createdAt (number), updatedAt (number). Index by filterOptionId.

2. SHARE FUNCTIONALITY:
   - Create components/ShareButton.tsx — a button that uses expo-sharing to share career path info (title, description, app deep link)
   - Add ShareButton to the CareerPathDetails.tsx component
   - Generate a shareable deep link format: skillmedia://career/{filterOptionId}

3. RANKING BADGE:
   - Create components/RankingBadge.tsx — shows "#1", "#2" etc. as a small badge with gradient background
   - Add RankingBadge to CareerPathHeroCard.tsx (top-right corner of card)
   - Use the primary gradient colors from the theme

4. ANNUAL VACANCIES:
   - Display annual vacancies on CareerPathHeroCard.tsx (e.g., "~45,000 vacancies/year")
   - Show with a briefcase icon, styled as a subtle info chip

5. IMPROVED CAREER CARD DETAIL (components/CareerPathDetails.tsx):
   - Section 1: Overview (description — already exists, improve layout)
   - Section 2: Requirements (parse requirements string, display as bullet list with checkmark icons)
   - Section 3: Salary Range (display avgSalary with currency formatting, show fresher vs experienced if data available)
   - Section 4: Relevant Exams (parse exams string, show as cards with exam name, frequency if available)
   - Section 5: Admin Articles (fetch from adminArticles table, show as expandable cards with title + preview)
   - Each section should use AnimatedCard with staggered entrance animations

6. ADMIN ARTICLES BACKEND (convex/adminArticles.ts):
   - getArticlesByFilterOption(filterOptionId) → returns published articles ordered by 'order' field
   - createArticle({ filterOptionId, title, content, authorId }) → creates article
   - updateArticle({ articleId, title, content, isPublished, order }) → updates article
   - deleteArticle({ articleId }) → deletes article

7. FILTER SORTING BY RANKING (convex/filter.ts):
   - Modify getFilterChildren() to sort results by ranking field (ascending, nulls last)
   - Modify getFilterOptionById() to return ranking and annualVacancies fields

8. ADMIN PANEL UPDATES (admin-dashboard/):
   - Modify AddFilterModal.tsx: add "Ranking" (number input) and "Annual Vacancies" (number input) fields
   - Create app/admin/articles/page.tsx: list all articles grouped by career path, with create/edit/delete
   - Create components/admin/ArticleEditor.tsx: form with title input, content textarea (markdown supported), publish toggle
   - Modify app/admin/page.tsx: add a stats section showing total cards, total likes, total saves, most popular cards

STYLE GUIDELINES:
- Follow the existing dark theme (bg: #0F1115, surface: #181A20, primary purple: #6C5DD3 or lavender #A0A6FF in dark mode)
- Use the Typography component for all text
- Cards should use border: 1px solid border color from theme, borderRadius from theme
- Animations: use Reanimated FadeInDown, FadeInUp for entrance animations
- All new components must support both dark and light themes via useTheme()

TEST AFTER BUILDING:
- Share button opens native share sheet with career info
- Ranking badges display correctly on cards
- Career card detail shows all 5 sections with proper data
- Admin can create/edit articles from admin panel
- Articles appear in mobile app career detail view
- Filter results are sorted by ranking
```

## Testing Checklist

- [ ] Share button on career card opens native share sheet
- [ ] Deep link format is correct (test by pasting link)
- [ ] Ranking badge shows on cards that have a ranking set
- [ ] Cards without ranking don't show a badge (no errors)
- [ ] Annual vacancies display correctly with formatting
- [ ] Career detail view shows all 5 structured sections
- [ ] Admin articles load within career detail view
- [ ] Empty states work (no articles, no ranking, no vacancies)
- [ ] Filter results sorted by ranking (admin-set order)
- [ ] Admin panel: can set ranking + vacancies when creating filter
- [ ] Admin panel: can create, edit, delete articles
- [ ] Admin panel: dashboard shows engagement stats
- [ ] Both dark and light themes render correctly

## Edge Cases & Notes

- Ranking is optional — cards without ranking appear after ranked cards
- Annual vacancies should handle null gracefully (don't show if not set)
- Admin articles support markdown in content — render with basic formatting
- Share deep links won't fully work until universal links are configured (Phase 5), but the share sheet should work
- When sorting by ranking, maintain existing createdAt sort as secondary sort

---

---

# PHASE 2: Community Groups & Real-time Chat

> **Goal:** Build WhatsApp/Telegram-style community groups around each career path. This is the biggest phase and the core engagement driver.

## Overview

Every career path card gets an associated community group. When users tap "Join" on a card, they enter the group with real-time chat, member directory, and admin announcements. This transforms SkillMedia from a discovery tool into a community platform.

## Prerequisites

- Phase 1A complete (ranking, articles, improved cards)
- At least 20+ career cards with descriptions populated
- Push notification setup (Firebase/Expo Notifications configured)

## Feature Checklist

### Mobile App

- [ ] **Groups tab** — New bottom tab "Groups" showing user's joined groups
- [ ] **Join button** on career cards — "Join Community" CTA that adds user to the group
- [ ] **Group auto-creation** — When admin publishes a career card, a group is auto-created
- [ ] **Group list screen** — My Groups with group icon, name, member count, last message preview, unread badge
- [ ] **Group chat screen** — Real-time message list with text, images, timestamps, sender info
- [ ] **Send text messages** — Input bar with send button
- [ ] **Send images** — Image picker integration for sharing images in chat
- [ ] **Message types** — Text, image, link (auto-detect URLs), announcement (admin-only, pinned)
- [ ] **Member directory** — View all group members with profile info
- [ ] **Admin announcements** — Pinned messages from admins (highlighted, always visible)
- [ ] **Group info screen** — Group description, member count, career card link, leave group option
- [ ] **Leave group** — User can leave a group
- [ ] **Unread message count** — Badge on Groups tab and per-group in list
- [ ] **Push notifications** — Notify users of new messages in joined groups (configurable)
- [ ] **Report message** — Users can report inappropriate messages
- [ ] **Delete own messages** — Users can delete their own messages
- [ ] **Scroll to bottom** — Floating button to jump to latest messages
- [ ] **Message pagination** — Load older messages on scroll up (infinite scroll)

### Admin Panel

- [ ] **Group management page** — List all groups with member count, message count, status
- [ ] **Group detail view** — See messages, members, reported content
- [ ] **Send announcement** — Create pinned announcement in any group
- [ ] **Moderate messages** — Delete any message, warn or ban users
- [ ] **View reports** — List of reported messages with context, take action (dismiss/delete/ban)
- [ ] **Group settings** — Set max members, enable/disable chat, set moderation level
- [ ] **Auto-group creation toggle** — Option to auto-create group when career card is published

## Schema Changes (Convex)

```typescript
// New table: groups
groups: defineTable({
  filterOptionId: v.id("FilterOption"),      // Linked career path
  name: v.string(),                          // Group name (usually = career path name)
  description: v.optional(v.string()),       // Group description
  coverImage: v.optional(v.string()),        // Group avatar/cover
  memberCount: v.number(),                   // Denormalized count for performance
  messageCount: v.optional(v.number()),      // Total messages
  createdBy: v.id("users"),                  // Admin who created
  isActive: v.boolean(),
  settings: v.optional(v.object({
    maxMembers: v.optional(v.number()),
    chatEnabled: v.optional(v.boolean()),
    moderationLevel: v.optional(v.string()), // "low" | "medium" | "strict"
  })),
  createdAt: v.number(),
})
  .index("by_filter_option", ["filterOptionId"])
  .index("by_active", ["isActive"]),

// New table: groupMembers
groupMembers: defineTable({
  groupId: v.id("groups"),
  userId: v.id("users"),
  role: v.union(v.literal("admin"), v.literal("moderator"), v.literal("member")),
  joinedAt: v.number(),
  lastReadAt: v.optional(v.number()),        // For unread count calculation
  isMuted: v.optional(v.boolean()),          // Mute notifications for this group
})
  .index("by_group", ["groupId"])
  .index("by_user", ["userId"])
  .index("by_group_and_user", ["groupId", "userId"]),

// New table: messages
messages: defineTable({
  groupId: v.id("groups"),
  userId: v.id("users"),
  content: v.string(),                       // Message text
  type: v.union(
    v.literal("text"),
    v.literal("image"),
    v.literal("link"),
    v.literal("announcement")
  ),
  imageUrl: v.optional(v.string()),          // For image messages
  storageId: v.optional(v.id("_storage")),   // Convex storage for images
  isPinned: v.optional(v.boolean()),
  isDeleted: v.optional(v.boolean()),        // Soft delete
  createdAt: v.number(),
})
  .index("by_group", ["groupId"])
  .index("by_group_and_created", ["groupId", "createdAt"]),

// New table: reports
reports: defineTable({
  reporterId: v.id("users"),
  messageId: v.optional(v.id("messages")),
  groupId: v.id("groups"),
  reason: v.string(),
  status: v.union(v.literal("pending"), v.literal("reviewed"), v.literal("dismissed")),
  actionTaken: v.optional(v.string()),       // "deleted" | "warned" | "banned"
  reviewedBy: v.optional(v.id("users")),
  createdAt: v.number(),
})
  .index("by_group", ["groupId"])
  .index("by_status", ["status"]),

// Update notifications table — add new types:
// Add to type union: "group_message", "group_join", "announcement"
// Add field: groupId: v.optional(v.id("groups"))
```

## New Screens & Routes

### Mobile App

```
app/
├── (tabs)/
│   ├── groups.tsx                    # NEW — My Groups list (new bottom tab)
│   └── _layout.tsx                   # MODIFY — Add Groups tab
├── group/
│   ├── [id].tsx                      # NEW — Group chat screen
│   ├── [id]/
│   │   ├── members.tsx               # NEW — Member directory
│   │   └── info.tsx                  # NEW — Group info/settings
```

### Admin Panel

```
admin-dashboard/app/admin/
├── groups/
│   ├── page.tsx                      # NEW — Groups management list
│   └── [id]/
│       └── page.tsx                  # NEW — Group detail (messages, members, reports)
├── reports/
│   └── page.tsx                      # NEW — Reports management
```

## New Components

### Mobile App

| Component                                  | Purpose                                                           |
| ------------------------------------------ | ----------------------------------------------------------------- |
| `components/groups/GroupListItem.tsx`      | Group card in My Groups list (icon, name, last msg, unread badge) |
| `components/groups/ChatMessage.tsx`        | Individual chat message bubble (text/image/announcement)          |
| `components/groups/ChatInput.tsx`          | Message input bar with send, image picker, emoji                  |
| `components/groups/GroupHeader.tsx`        | Group chat header (name, member count, info button)               |
| `components/groups/MemberCard.tsx`         | Member profile card in directory                                  |
| `components/groups/AnnouncementBanner.tsx` | Pinned announcement display at top of chat                        |
| `components/groups/JoinGroupButton.tsx`    | "Join Community" CTA for career cards                             |
| `components/groups/ReportModal.tsx`        | Report message bottom sheet                                       |
| `components/groups/UnreadBadge.tsx`        | Unread message count badge                                        |

### Admin Panel

| Component                               | Purpose                                |
| --------------------------------------- | -------------------------------------- |
| `components/admin/GroupCard.tsx`        | Group summary card for management list |
| `components/admin/MessageList.tsx`      | View messages in admin context         |
| `components/admin/ReportCard.tsx`       | Report display with action buttons     |
| `components/admin/AnnouncementForm.tsx` | Create/edit announcement form          |

## Backend Functions (Convex)

```
convex/groups.ts:
  - createGroup({ filterOptionId, name, description }) → mutation (admin only)
  - getGroup(groupId) → query
  - getUserGroups(userId) → query (returns all groups user has joined)
  - getGroupByFilterOption(filterOptionId) → query
  - updateGroupSettings(groupId, settings) → mutation (admin only)
  - getAllGroups() → query (admin — all groups with stats)

convex/groupMembers.ts:
  - joinGroup(groupId) → mutation (adds current user)
  - leaveGroup(groupId) → mutation (removes current user)
  - getGroupMembers(groupId) → query (with user profiles)
  - isGroupMember(groupId, userId) → query
  - getUnreadCount(groupId, userId) → query (messages after lastReadAt)
  - updateLastRead(groupId) → mutation (sets lastReadAt to now)
  - removeMembers(groupId, userId) → mutation (admin only)

convex/messages.ts:
  - sendMessage({ groupId, content, type, imageUrl? }) → mutation
  - getMessages(groupId, limit, cursor?) → query (paginated, newest first)
  - deleteMessage(messageId) → mutation (soft delete, own msg or admin)
  - pinMessage(messageId) → mutation (admin only)
  - unpinMessage(messageId) → mutation (admin only)
  - getPinnedMessages(groupId) → query
  - generateUploadUrl() → mutation (for image uploads)

convex/reports.ts:
  - createReport({ messageId, groupId, reason }) → mutation
  - getReports(status?) → query (admin)
  - reviewReport(reportId, action) → mutation (admin)
```

## AI Prompt for Developer

```
You are building Community Groups & Real-time Chat for the SkillMedia Expo mobile app.

PROJECT CONTEXT:
- Tech stack: React Native 0.79.5, Expo 53, Expo Router, Convex (real-time backend), Clerk (auth)
- Project structure: app/ (screens), components/ (shared), convex/ (backend), constants/ (theme), admin-dashboard/ (Next.js)
- Theme: use useTheme() hook from providers/ThemeProvider.tsx — supports dark (#0F1115 bg) and light themes
- UI library at components/ui/ — use Typography, AnimatedButton, AnimatedCard, GlassCard, EmptyState, etc.
- Animations: react-native-reanimated (FadeInDown, FadeInUp, SlideInRight patterns)
- Bottom sheets: @gorhom/bottom-sheet
- Auth: useAuth() from Clerk for current user, useQuery/useMutation from convex/react for data

EXISTING SCHEMA (convex/schema.ts):
- users: username, fullname, email, bio, profileImage, clerkId, isAdmin
- FilterOption: name, type, parentId, description, requirements, avgSalary, relevantExams, image, likes, comments, isActive, ranking, annualVacancies
- communityPosts, likes, comments, notifications, savedContent, adminArticles tables exist

TASK — Build Community Groups (Phase 2):

1. SCHEMA ADDITIONS (convex/schema.ts):
   Add these 4 new tables:

   a) "groups" table:
      - filterOptionId: v.id("FilterOption")
      - name: v.string()
      - description: v.optional(v.string())
      - coverImage: v.optional(v.string())
      - memberCount: v.number()
      - messageCount: v.optional(v.number())
      - createdBy: v.id("users")
      - isActive: v.boolean()
      - settings: v.optional(v.object({ maxMembers: v.optional(v.number()), chatEnabled: v.optional(v.boolean()), moderationLevel: v.optional(v.string()) }))
      - createdAt: v.number()
      - Indexes: by_filter_option [filterOptionId], by_active [isActive]

   b) "groupMembers" table:
      - groupId: v.id("groups"), userId: v.id("users")
      - role: v.union(v.literal("admin"), v.literal("moderator"), v.literal("member"))
      - joinedAt: v.number()
      - lastReadAt: v.optional(v.number())
      - isMuted: v.optional(v.boolean())
      - Indexes: by_group [groupId], by_user [userId], by_group_and_user [groupId, userId]

   c) "messages" table:
      - groupId: v.id("groups"), userId: v.id("users")
      - content: v.string()
      - type: v.union(v.literal("text"), v.literal("image"), v.literal("link"), v.literal("announcement"))
      - imageUrl: v.optional(v.string())
      - storageId: v.optional(v.id("_storage"))
      - isPinned: v.optional(v.boolean())
      - isDeleted: v.optional(v.boolean())
      - createdAt: v.number()
      - Indexes: by_group [groupId], by_group_and_created [groupId, createdAt]

   d) "reports" table:
      - reporterId: v.id("users"), messageId: v.optional(v.id("messages")), groupId: v.id("groups")
      - reason: v.string()
      - status: v.union(v.literal("pending"), v.literal("reviewed"), v.literal("dismissed"))
      - actionTaken: v.optional(v.string()), reviewedBy: v.optional(v.id("users"))
      - createdAt: v.number()
      - Indexes: by_group [groupId], by_status [status]

   Also update "notifications" table to add "group_message" and "announcement" to the type union, and add groupId: v.optional(v.id("groups")) field.

2. BACKEND FUNCTIONS:
   Create convex/groups.ts, convex/groupMembers.ts, convex/messages.ts, convex/reports.ts with all the CRUD queries and mutations. Key points:
   - joinGroup should increment memberCount on the groups table (denormalized)
   - leaveGroup should decrement memberCount
   - sendMessage should use Convex real-time — messages query will auto-update on all clients
   - getMessages should support pagination (use .paginate() with cursor)
   - deleteMessage should soft-delete (set isDeleted: true), not hard delete
   - Admin-only mutations should verify user.isAdmin before executing

3. NEW SCREENS:
   a) app/(tabs)/groups.tsx — "My Groups" tab:
      - Show list of groups the user has joined (query groupMembers by userId, then fetch group details)
      - Each group shows: icon/cover, name, member count, last message preview, unread badge
      - Empty state if no groups joined: "Join a career path to unlock its community group"
      - Tap group → navigate to /group/[id]

   b) Modify app/(tabs)/_layout.tsx — Add "Groups" as a new bottom tab (icon: MessageCircle or similar from @expo/vector-icons)

   c) app/group/[id].tsx — Group Chat Screen:
      - Header: group name, member count, back button, info button (→ group info)
      - Pinned announcement banner at top (if any pinned messages exist)
      - Message list: FlatList with inverted layout (newest at bottom), messages show sender avatar, name, text/image, timestamp
      - Message bubbles: left-aligned for others, right-aligned for current user
      - Admin messages: highlighted with admin badge
      - Input bar at bottom: text input + image picker button + send button
      - Floating "scroll to bottom" button when scrolled up
      - Load more on scroll to top (pagination)
      - Long-press message for options: Copy, Report, Delete (own messages only)

   d) app/group/[id]/members.tsx — Member Directory:
      - List of all members with avatar, name, role badge (Admin/Member), join date
      - Search/filter members

   e) app/group/[id]/info.tsx — Group Info:
      - Group name, description, cover image, member count
      - Link back to career card
      - "Leave Group" button (with confirmation)
      - Mute notifications toggle

4. NEW COMPONENTS (in components/groups/):
   - GroupListItem.tsx: group card for the list (icon, name, last msg snippet, unread count badge, member count)
   - ChatMessage.tsx: message bubble with avatar, sender name, content, timestamp, type-specific rendering
   - ChatInput.tsx: text input with send button, image picker, haptic feedback on send
   - GroupHeader.tsx: navigation header with group name and member count
   - MemberCard.tsx: member profile row for directory
   - AnnouncementBanner.tsx: pinned announcement card at top of chat
   - JoinGroupButton.tsx: "Join Community" button for career cards (checks if already joined)
   - ReportModal.tsx: bottom sheet for reporting messages (reason selection)
   - UnreadBadge.tsx: small red badge with count

5. JOIN FLOW:
   - On CareerPathDetails.tsx (or CareerPathHeroCard.tsx), add a "Join Community" button
   - If a group exists for this career path (query groups by filterOptionId):
     - If user is NOT a member → show "Join Community" (green, primary gradient)
     - If user IS a member → show "Open Group" (navigate to chat)
   - Joining creates a groupMembers entry with role="member" and increments group.memberCount

6. ADMIN PANEL UPDATES:
   - Create admin-dashboard/app/admin/groups/page.tsx: table of all groups with columns (Name, Members, Messages, Status, Actions)
   - Create admin-dashboard/app/admin/groups/[id]/page.tsx: group detail with message feed, member list, reports tab
   - Create admin-dashboard/app/admin/reports/page.tsx: all pending reports with message context, action buttons (Dismiss, Delete Message, Ban User)
   - Add "Send Announcement" button in group detail → form to write pinned message
   - Groups should auto-create when an admin publishes a new career card filter option — add this logic in the filter creation mutation

STYLE GUIDELINES:
- Chat bubbles: own messages have primary gradient background, others have surface/card background
- Sender name: primary color for admin, text color for regular users
- Unread badge: small red circle with white count text
- Message timestamps: textDim color, 11px size
- Pinned announcements: highlighted border with accent color, icon prefix
- Group list: similar style to the existing bookmarks/notifications list
- Animations: messages should enter with subtle FadeIn, use LayoutAnimation for list updates
- Haptic feedback on send message (Haptics.impactAsync light)

USE CASE to keep in mind:
An 18-year-old student discovers the NDA career path, taps "Join Community", enters the NDA Preparation group, sees pinned announcements about upcoming exams, chats with peers about preparation strategies, and asks questions that get answered by group members and admins.

TEST AFTER BUILDING:
- User can see "Groups" tab in bottom navigation
- User can join a group from a career card
- After joining, group appears in "My Groups" tab
- Real-time chat works (send message → appears instantly for all members)
- Image sharing works in chat
- Pinned announcements appear at top of chat
- Unread badge appears on Groups tab and per-group
- User can leave a group (with confirmation)
- User can report a message
- Admin can send announcements from admin panel
- Admin can view/act on reports from admin panel
- Empty states work correctly
```

## Testing Checklist

- [ ] Groups tab appears in bottom navigation with icon
- [ ] My Groups list shows joined groups with correct info
- [ ] "Join Community" button appears on career cards
- [ ] Joining a group increments member count
- [ ] Group chat loads with existing messages
- [ ] Sending text messages works in real-time
- [ ] Sending images works (picker + upload + display)
- [ ] Messages appear in correct order (newest at bottom)
- [ ] Own messages styled differently (right-aligned, gradient bg)
- [ ] Pinned announcements display at chat top
- [ ] Member directory shows all members with roles
- [ ] Leave group works with confirmation dialog
- [ ] Unread badge updates correctly
- [ ] Report message flow works
- [ ] Admin panel shows all groups with stats
- [ ] Admin can send announcements
- [ ] Admin can moderate (delete messages, view reports)
- [ ] Empty states for no groups, no messages
- [ ] Both dark and light themes work

## Edge Cases & Notes

- **Real-time via Convex:** Convex subscriptions handle real-time automatically — `useQuery()` for messages will auto-update when new messages are inserted. No need for Socket.io.
- **Pagination:** Use Convex `.paginate()` for message history. Load 50 messages initially, load more on scroll up.
- **Image uploads:** Use Convex storage (`generateUploadUrl` + `store`) for image messages. Display with `expo-image` for caching.
- **Soft delete:** Never hard-delete messages. Set `isDeleted: true` and show "This message was deleted" in UI.
- **Member limit:** Start with no limit, add configurable limit later if needed.
- **Notifications:** Initially, don't send push for every message (too noisy). Only push for announcements and direct mentions.
- **Auto-group creation:** When admin creates a FilterOption that is a leaf node (type = "role"), auto-create a group for it.

---

---

# PHASE 3: Structured Roadmaps

> **Goal:** Add step-by-step learning roadmaps within community groups so users have actionable guidance, not just information.

## Overview

Each community group gets an admin-created roadmap — a multi-phase learning plan with milestones, steps, and resources. Users can track their personal progress through the roadmap. This transforms the group from a chat room into a structured learning environment.

## Prerequisites

- Phase 2 complete (groups and chat working)
- At least 5 groups with active members
- Admin panel group management functional

## Feature Checklist

### Mobile App

- [ ] **Roadmap tab in groups** — Tab within group screen showing the roadmap
- [ ] **Visual timeline** — Roadmap displayed as a vertical timeline with milestone markers
- [ ] **Milestones** — Expandable sections representing phases (e.g., "Phase 1: Foundation")
- [ ] **Steps within milestones** — Checklist items with checkbox, title, description
- [ ] **Resource links** — Tappable links to YouTube, articles, books within steps
- [ ] **Personal progress tracking** — User can mark steps as complete (persisted)
- [ ] **Progress bar** — Overall roadmap progress (X% complete) shown at top
- [ ] **Milestone completion** — Visual indicator when all steps in a milestone are done
- [ ] **Progress on profile** — Show roadmap progress summary on user profile
- [ ] **Progress in group list** — Show user's roadmap progress % in My Groups list

### Admin Panel

- [ ] **Roadmap builder** — Create/edit roadmaps with drag-and-drop milestone and step ordering
- [ ] **Milestone management** — Add/edit/delete/reorder milestones with title, description, estimated duration
- [ ] **Step management** — Add/edit/delete/reorder steps within milestones
- [ ] **Resource attachment** — Add resource links (URL, type label) to steps
- [ ] **Assign roadmap to group** — Link a roadmap to a specific group/career path
- [ ] **Roadmap templates** — Save/load roadmap templates for similar career paths
- [ ] **Progress analytics** — View how many users completed each milestone/step
- [ ] **Publish/draft roadmap** — Draft mode for roadmaps being built

## Schema Changes (Convex)

```typescript
// New table: roadmaps
roadmaps: defineTable({
  groupId: v.id("groups"),                   // Which group this roadmap belongs to
  filterOptionId: v.optional(v.id("FilterOption")), // Also link to career path
  title: v.string(),                         // "NDA Preparation Roadmap"
  description: v.optional(v.string()),
  totalMilestones: v.optional(v.number()),   // Denormalized count
  totalSteps: v.optional(v.number()),        // Denormalized count
  isPublished: v.boolean(),
  createdBy: v.id("users"),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_group", ["groupId"])
  .index("by_filter_option", ["filterOptionId"]),

// New table: milestones
milestones: defineTable({
  roadmapId: v.id("roadmaps"),
  title: v.string(),                         // "Phase 1: Foundation"
  description: v.optional(v.string()),
  order: v.number(),                         // Display order (1, 2, 3...)
  estimatedDuration: v.optional(v.string()), // "4 weeks"
  icon: v.optional(v.string()),              // Emoji or icon name
  createdAt: v.number(),
})
  .index("by_roadmap", ["roadmapId"]),

// New table: roadmapSteps
roadmapSteps: defineTable({
  milestoneId: v.id("milestones"),
  title: v.string(),                         // "Learn HTML basics"
  description: v.optional(v.string()),       // Detailed instructions
  type: v.union(
    v.literal("task"),                       // Something to do
    v.literal("resource"),                   // Link to learn from
    v.literal("checkpoint")                  // Assessment point (linked to quiz)
  ),
  resourceUrl: v.optional(v.string()),       // YouTube link, article URL
  resourceLabel: v.optional(v.string()),     // "Watch: React Crash Course"
  quizId: v.optional(v.string()),            // Future: link to quiz for checkpoints
  order: v.number(),                         // Display order
  createdAt: v.number(),
})
  .index("by_milestone", ["milestoneId"]),

// New table: userProgress
userProgress: defineTable({
  userId: v.id("users"),
  roadmapId: v.id("roadmaps"),
  stepId: v.id("roadmapSteps"),
  completedAt: v.number(),
})
  .index("by_user_and_roadmap", ["userId", "roadmapId"])
  .index("by_user_and_step", ["userId", "stepId"]),
```

## New Screens & Components

### Mobile App Screens

```
app/group/[id]/roadmap.tsx           # Roadmap view (accessed as tab within group)
```

### New Components

| Component                                     | Purpose                                             |
| --------------------------------------------- | --------------------------------------------------- |
| `components/roadmap/RoadmapView.tsx`          | Full roadmap display with timeline                  |
| `components/roadmap/MilestoneCard.tsx`        | Expandable milestone section                        |
| `components/roadmap/StepItem.tsx`             | Individual step with checkbox, title, resource link |
| `components/roadmap/ProgressHeader.tsx`       | Overall progress bar + stats at top                 |
| `components/roadmap/ResourceLink.tsx`         | Tappable resource link with icon by type            |
| `components/roadmap/RoadmapProgressBadge.tsx` | Small progress indicator for group list / profile   |

### Admin Panel

```
admin-dashboard/app/admin/roadmaps/page.tsx           # Roadmap management list
admin-dashboard/app/admin/roadmaps/[id]/page.tsx       # Roadmap builder/editor
admin-dashboard/components/admin/RoadmapBuilder.tsx    # Drag-and-drop milestone/step editor
admin-dashboard/components/admin/MilestoneEditor.tsx   # Milestone form
admin-dashboard/components/admin/StepEditor.tsx        # Step form with resource fields
admin-dashboard/components/admin/ProgressStats.tsx     # User progress analytics
```

## Backend Functions (Convex)

```
convex/roadmaps.ts:
  - createRoadmap({ groupId, title, description }) → mutation (admin)
  - getRoadmap(roadmapId) → query
  - getRoadmapByGroup(groupId) → query
  - updateRoadmap({ roadmapId, title, description, isPublished }) → mutation
  - deleteRoadmap(roadmapId) → mutation
  - getAllRoadmaps() → query (admin)

convex/milestones.ts:
  - createMilestone({ roadmapId, title, description, order, estimatedDuration, icon }) → mutation
  - getMilestones(roadmapId) → query (ordered by 'order')
  - updateMilestone({ milestoneId, title, description, order }) → mutation
  - deleteMilestone(milestoneId) → mutation (cascades to steps)
  - reorderMilestones(roadmapId, orderedIds) → mutation

convex/roadmapSteps.ts:
  - createStep({ milestoneId, title, description, type, resourceUrl, resourceLabel, order }) → mutation
  - getSteps(milestoneId) → query (ordered by 'order')
  - updateStep({ stepId, title, description, type, resourceUrl }) → mutation
  - deleteStep(stepId) → mutation
  - reorderSteps(milestoneId, orderedIds) → mutation

convex/userProgress.ts:
  - toggleStepComplete(stepId, roadmapId) → mutation (add or remove progress entry)
  - getUserProgress(userId, roadmapId) → query (all completed steps for a roadmap)
  - getRoadmapProgressSummary(userId, roadmapId) → query (returns { completed, total, percent })
  - getMilestoneProgress(userId, milestoneId) → query
  - getGroupProgressStats(roadmapId) → query (admin — aggregate stats)
```

## AI Prompt for Developer

```
You are building Structured Roadmaps for the SkillMedia Expo mobile app.

PROJECT CONTEXT:
- Tech stack: React Native 0.79.5, Expo 53, Expo Router, Convex, Clerk
- Project at root with: app/ (screens), components/ (shared), convex/ (backend), admin-dashboard/ (Next.js admin)
- Theme: useTheme() from providers/ThemeProvider.tsx
- UI components: components/ui/ (Typography, AnimatedButton, AnimatedCard, GlassCard, ProgressBar, etc.)
- Community Groups already built: groups, groupMembers, messages tables exist. Group chat screen at app/group/[id].tsx
- Animations: react-native-reanimated

EXISTING CONTEXT:
- Groups have a groupId. Each group is linked to a FilterOption (career path)
- The group chat screen at app/group/[id].tsx already exists
- Users can join/leave groups, send messages

TASK — Build Roadmaps (Phase 3):

1. SCHEMA (convex/schema.ts):
   Add 4 tables: roadmaps, milestones, roadmapSteps, userProgress (see full schema definitions above in this document)

2. BACKEND (convex/):
   Create convex/roadmaps.ts, convex/milestones.ts, convex/roadmapSteps.ts, convex/userProgress.ts
   Key behaviors:
   - getRoadmapByGroup(groupId) returns the roadmap for a group (if published)
   - getMilestones(roadmapId) returns milestones sorted by order
   - getSteps(milestoneId) returns steps sorted by order
   - toggleStepComplete: if progress entry exists → delete it (unmark), if not → create it (mark complete)
   - getRoadmapProgressSummary: counts completed steps vs total steps for a user/roadmap

3. MOBILE SCREENS:
   a) Roadmap Tab in Group:
      - The group screen at app/group/[id].tsx should have a tab bar at top: "Chat" | "Roadmap" | (future: "Quiz")
      - When "Roadmap" tab is selected, show the roadmap content
      - OR create app/group/[id]/roadmap.tsx as a separate screen accessible from group

   b) Roadmap View (components/roadmap/RoadmapView.tsx):
      - Header: roadmap title, overall progress bar (X/Y steps completed, Z%)
      - Vertical timeline with milestone markers (colored dots/icons connected by lines)
      - Each milestone is an expandable card showing:
        - Milestone title + icon + estimated duration
        - Progress within milestone (e.g., "3/5 steps")
        - When expanded: list of StepItem components
      - Completed milestones show a green checkmark

   c) StepItem (components/roadmap/StepItem.tsx):
      - Checkbox (animated with Reanimated — scale pop on toggle)
      - Step title + description
      - Resource link button (if resourceUrl exists) — opens in-app WebView or external browser
      - Visual states: incomplete (muted), completed (green checkmark, line-through title)
      - Haptic feedback on toggle

   d) Profile Progress:
      - On app/(tabs)/profile.tsx, add a "My Roadmaps" section
      - Show cards for each roadmap the user has started, with progress bar and %

4. ADMIN PANEL:
   a) admin-dashboard/app/admin/roadmaps/page.tsx:
      - Table of all roadmaps: Title, Group, Steps count, Published status, Actions
      - "Create Roadmap" button → new/edit page

   b) admin-dashboard/app/admin/roadmaps/[id]/page.tsx:
      - Roadmap title + description editor
      - Milestone list with drag-to-reorder (or up/down buttons)
      - Each milestone expandable to show its steps
      - "Add Milestone" button
      - Each step has: title, description, type (task/resource/checkpoint), resource URL, resource label
      - "Add Step" button within each milestone
      - "Publish Roadmap" toggle
      - Progress stats: how many users started, average completion %, per-milestone completion rates

   c) Link roadmap to group:
      - In the roadmap editor, select which group/career path this roadmap belongs to
      - A group can have exactly 1 roadmap

STYLE GUIDELINES:
- Timeline: vertical line (1-2px, borderLight color) connecting milestone dots
- Milestone dots: 12-16px circles, filled with gradient when completed, outlined when pending
- Step checkboxes: 20x20px rounded squares, green fill + checkmark icon when completed
- Progress bar: linear gradient from primary to accent (same as rest of app)
- Resource links: show with an external link icon, styled as small chips/buttons
- Milestone cards: use surface background with border, padding 20px, borderRadius 16
- Completed steps: title color changes to textMuted, subtle line-through or checkmark prefix
- Animate milestone expand/collapse with Reanimated (height interpolation or LayoutAnimation)

USE CASE:
A student joins the NDA Preparation group and taps "Roadmap" tab. They see a 3-phase roadmap:
Phase 1: Foundation (4 weeks) — Learn about NDA exam pattern, study NCERT Math, practice English
Phase 2: Core Preparation (8 weeks) — Solve previous year papers, take topic-wise tests
Phase 3: Mock Tests (4 weeks) — Full-length mock tests, revision, SSB awareness
They start marking steps as done. Their progress shows on their profile. The admin can see that 65% of members completed Phase 1.

TEST AFTER BUILDING:
- Roadmap displays with timeline in group
- Milestones expand/collapse
- Steps can be toggled complete/incomplete
- Progress bar updates in real-time
- Resource links open correctly
- Progress persists (refresh doesn't lose progress)
- Profile shows roadmap progress
- Admin can create full roadmap with milestones and steps
- Admin can publish/unpublish roadmap
- Admin can see progress analytics
```

## Testing Checklist

- [ ] Roadmap tab/section visible in group screen
- [ ] Timeline renders with milestones and steps
- [ ] Milestone expand/collapse animation works
- [ ] Step checkbox toggles with animation and haptic
- [ ] Progress bar updates when steps are toggled
- [ ] Resource links open in browser/WebView
- [ ] Progress persists across sessions
- [ ] Profile shows roadmap progress cards
- [ ] Admin can create roadmap with milestones + steps
- [ ] Admin can reorder milestones and steps
- [ ] Admin can publish/unpublish roadmap
- [ ] Admin can see per-milestone completion stats
- [ ] Empty states (no roadmap for group, no progress yet)
- [ ] Both themes work correctly

---

---

# PHASE 4: Quizzes, Tests & Engagement

> **Goal:** Add daily quizzes, weekly challenges, mock test series, leaderboards, and streak tracking to drive daily engagement and learning.

## Overview

This phase adds the gamification and assessment layer. Users get daily quizzes (5-10 MCQ), weekly practical challenges, and full-length timed mock tests. Leaderboards and streak tracking create competitive motivation. All content is admin-created to ensure quality.

## Prerequisites

- Phase 3 complete (roadmaps working with progress tracking)
- Groups have active members
- Admin panel can manage groups and roadmaps

## Feature Checklist

### Mobile App

- [ ] **Quiz tab in groups** — "Quiz" tab within group screen
- [ ] **Daily quiz** — 5-10 MCQ questions with timer per question
- [ ] **Question types** — MCQ single correct, MCQ multiple correct, True/False, Fill in blank
- [ ] **Quiz attempt flow** — Question by question view, answer selection, next button
- [ ] **Timer** — Countdown per question (configurable by admin), auto-submit on timeout
- [ ] **Instant results** — Score, correct/wrong breakdown, answer explanations
- [ ] **Weekly challenges** — Task description, submission (text/link), deadline countdown
- [ ] **Mock test series** — Full-length timed exam (30-60-120 min), auto-submit, detailed results
- [ ] **Leaderboard** — Group leaderboard by quiz scores (weekly, monthly, all-time)
- [ ] **Streak tracking** — Consecutive days of quiz completion, streak count display
- [ ] **Streak badge on profile** — Fire emoji + streak count on user profile
- [ ] **Performance analytics** — Personal stats: accuracy %, avg time, improvement trend
- [ ] **Quiz notifications** — Push notification when daily quiz is available
- [ ] **Challenge submissions** — Submit challenge answers (text/link form)

### Admin Panel

- [ ] **Quiz builder** — Create quiz with title, type, time limit, scheduling
- [ ] **Question editor** — Add questions with options, correct answer(s), explanation
- [ ] **Question bank** — Reusable question library, search/filter by topic
- [ ] **Schedule quizzes** — Set daily/weekly/monthly quiz schedules
- [ ] **Test series creator** — Create timed mock tests with multiple sections
- [ ] **Challenge creator** — Create weekly challenges with description and deadline
- [ ] **Quiz analytics** — Average scores, completion rates, per-question analysis
- [ ] **Leaderboard management** — View and reset leaderboards
- [ ] **Bulk question import** — Import questions from CSV/JSON

## Schema Changes (Convex)

```typescript
// New table: quizzes
quizzes: defineTable({
  groupId: v.id("groups"),
  title: v.string(),                         // "NDA Daily Quiz - Day 15"
  description: v.optional(v.string()),
  type: v.union(
    v.literal("daily"),
    v.literal("weekly"),
    v.literal("test_series")
  ),
  timeLimit: v.optional(v.number()),         // Total time in seconds (for test series)
  perQuestionTime: v.optional(v.number()),   // Time per question in seconds (for daily)
  totalQuestions: v.number(),
  scheduledAt: v.optional(v.number()),       // When this quiz becomes available
  expiresAt: v.optional(v.number()),         // When this quiz is no longer available
  isPublished: v.boolean(),
  createdBy: v.id("users"),
  createdAt: v.number(),
})
  .index("by_group", ["groupId"])
  .index("by_group_and_type", ["groupId", "type"])
  .index("by_scheduled", ["scheduledAt"]),

// New table: questions
questions: defineTable({
  quizId: v.id("quizzes"),
  text: v.string(),                          // Question text
  type: v.union(
    v.literal("mcq_single"),                // Single correct MCQ
    v.literal("mcq_multiple"),              // Multiple correct MCQ
    v.literal("true_false"),                // True or False
    v.literal("fill_blank")                 // Fill in the blank
  ),
  options: v.optional(v.array(v.string())), // Answer options (for MCQ/TF)
  correctAnswer: v.union(
    v.string(),                             // For single answer
    v.array(v.string())                     // For multiple correct
  ),
  explanation: v.optional(v.string()),       // Why this is the correct answer
  order: v.number(),
  points: v.optional(v.number()),            // Points for this question (default 1)
  imageUrl: v.optional(v.string()),          // Optional question image
})
  .index("by_quiz", ["quizId"]),

// New table: quizAttempts
quizAttempts: defineTable({
  userId: v.id("users"),
  quizId: v.id("quizzes"),
  answers: v.array(v.object({
    questionId: v.id("questions"),
    selectedAnswer: v.union(v.string(), v.array(v.string())),
    isCorrect: v.boolean(),
    timeTaken: v.optional(v.number()),       // Seconds taken for this question
  })),
  score: v.number(),                         // Total score
  totalPoints: v.number(),                   // Max possible score
  percentage: v.number(),                    // Score percentage
  timeTaken: v.number(),                     // Total time in seconds
  completedAt: v.number(),
})
  .index("by_user", ["userId"])
  .index("by_quiz", ["quizId"])
  .index("by_user_and_quiz", ["userId", "quizId"]),

// New table: challenges
challenges: defineTable({
  groupId: v.id("groups"),
  title: v.string(),
  description: v.string(),                  // Full challenge description
  type: v.literal("weekly"),
  deadline: v.number(),                      // Submission deadline
  submissionFormat: v.optional(v.string()),  // "text" | "link" | "image"
  isActive: v.boolean(),
  createdBy: v.id("users"),
  createdAt: v.number(),
})
  .index("by_group", ["groupId"]),

// New table: challengeSubmissions
challengeSubmissions: defineTable({
  userId: v.id("users"),
  challengeId: v.id("challenges"),
  content: v.string(),                      // Submission text/link
  imageUrl: v.optional(v.string()),
  submittedAt: v.number(),
})
  .index("by_challenge", ["challengeId"])
  .index("by_user_and_challenge", ["userId", "challengeId"]),

// New table: streaks
streaks: defineTable({
  userId: v.id("users"),
  currentStreak: v.number(),                // Current consecutive days
  longestStreak: v.number(),                // All-time best
  lastActivityDate: v.string(),             // "2026-02-25" format
  totalQuizzesTaken: v.optional(v.number()),
})
  .index("by_user", ["userId"]),
```

## New Screens & Components

### Mobile App

```
app/group/[id]/quiz/index.tsx              # Quiz list for this group
app/group/[id]/quiz/[quizId].tsx           # Take quiz screen
app/group/[id]/quiz/[quizId]/results.tsx   # Quiz results + explanations
app/group/[id]/leaderboard.tsx             # Group leaderboard
app/group/[id]/challenges/index.tsx        # Challenges list
app/group/[id]/challenges/[challengeId].tsx # Challenge detail + submission
```

### New Components

| Component                               | Purpose                                               |
| --------------------------------------- | ----------------------------------------------------- |
| `components/quiz/QuizCard.tsx`          | Quiz summary card (title, type, question count, time) |
| `components/quiz/QuestionView.tsx`      | Single question display with answer options           |
| `components/quiz/MCQOption.tsx`         | Selectable MCQ option with radio/checkbox             |
| `components/quiz/TimerBar.tsx`          | Countdown timer (animated bar or circular)            |
| `components/quiz/QuizResults.tsx`       | Results summary (score, correct/wrong, time)          |
| `components/quiz/AnswerExplanation.tsx` | Correct answer + explanation for review               |
| `components/quiz/LeaderboardRow.tsx`    | Leaderboard entry (rank, avatar, name, score)         |
| `components/quiz/StreakBadge.tsx`       | Fire emoji + streak count display                     |
| `components/quiz/ChallengeCard.tsx`     | Challenge summary with deadline countdown             |
| `components/quiz/SubmissionForm.tsx`    | Challenge submission form                             |
| `components/quiz/PerformanceChart.tsx`  | Accuracy/improvement trend (simple bar chart)         |

### Admin Panel

```
admin-dashboard/app/admin/quizzes/page.tsx              # All quizzes management
admin-dashboard/app/admin/quizzes/new/page.tsx           # Quiz builder
admin-dashboard/app/admin/quizzes/[id]/page.tsx          # Quiz editor + analytics
admin-dashboard/app/admin/challenges/page.tsx            # Challenges management
admin-dashboard/app/admin/challenges/new/page.tsx        # Create challenge
admin-dashboard/components/admin/QuizBuilder.tsx         # Quiz creation form
admin-dashboard/components/admin/QuestionEditor.tsx      # Question form with options
admin-dashboard/components/admin/QuizAnalytics.tsx       # Score distribution, completion stats
admin-dashboard/components/admin/LeaderboardView.tsx     # Admin leaderboard view
```

## Backend Functions (Convex)

```
convex/quizzes.ts:
  - createQuiz({ groupId, title, type, timeLimit, perQuestionTime }) → mutation (admin)
  - getQuizzes(groupId, type?) → query
  - getQuiz(quizId) → query (with questions)
  - updateQuiz() → mutation
  - deleteQuiz() → mutation
  - getAvailableQuizzes(groupId) → query (published, not expired, not attempted by user)
  - scheduleQuiz(quizId, scheduledAt, expiresAt) → mutation

convex/questions.ts:
  - addQuestion({ quizId, text, type, options, correctAnswer, explanation, order }) → mutation
  - getQuestions(quizId) → query (ordered)
  - updateQuestion() → mutation
  - deleteQuestion() → mutation
  - bulkCreateQuestions(quizId, questions[]) → mutation

convex/quizAttempts.ts:
  - submitAttempt({ quizId, answers[], timeTaken }) → mutation
    (calculates score, creates attempt record, updates streak)
  - getAttempt(userId, quizId) → query
  - getUserAttempts(userId) → query (all quiz history)
  - getQuizAttempts(quizId) → query (admin — all attempts for a quiz)
  - getQuizStats(quizId) → query (admin — avg score, completion rate, per-question accuracy)

convex/challenges.ts:
  - createChallenge({ groupId, title, description, deadline }) → mutation
  - getChallenges(groupId) → query
  - submitChallenge(challengeId, content) → mutation
  - getSubmissions(challengeId) → query (admin)
  - getUserSubmission(userId, challengeId) → query

convex/streaks.ts:
  - getStreak(userId) → query
  - updateStreak(userId) → internal mutation (called by submitAttempt)
    (if lastActivityDate is yesterday → increment, if today → no-op, if older → reset to 1)

convex/leaderboard.ts:
  - getGroupLeaderboard(groupId, period?) → query
    (aggregates quiz scores for group members, returns ranked list)
  - getGlobalLeaderboard(period?) → query (across all groups)
```

## AI Prompt for Developer

```
You are building Quizzes, Tests & Engagement features for the SkillMedia Expo mobile app.

PROJECT CONTEXT:
- Tech stack: React Native 0.79.5, Expo 53, Expo Router, Convex, Clerk
- Existing: app/ screens, components/ shared, convex/ backend, admin-dashboard/ Next.js admin
- Theme: useTheme() from providers/ThemeProvider.tsx (dark: #0F1115 bg, light mode too)
- UI components: components/ui/ (Typography, AnimatedButton, AnimatedCard, GlassCard, ProgressBar)
- Groups, chat, roadmaps already built (Phase 2 & 3 complete)
- Animations: react-native-reanimated
- Haptics: expo-haptics

TASK — Build Quizzes, Tests & Engagement (Phase 4):

1. SCHEMA: Add 6 tables: quizzes, questions, quizAttempts, challenges, challengeSubmissions, streaks
   (Full definitions provided in the development phases document)

2. QUIZ FLOW (Mobile):
   a) Quiz List Screen (app/group/[id]/quiz/index.tsx):
      - Show available quizzes for the group: Daily Quiz, Weekly Quiz, Test Series
      - Each quiz card shows: title, type badge, question count, time limit, "Start" button
      - Completed quizzes show score and "Review" button
      - Locked quizzes (scheduled for future) show countdown

   b) Take Quiz Screen (app/group/[id]/quiz/[quizId].tsx):
      - Full-screen quiz experience
      - Header: quiz title, progress (Q 3/10), timer
      - One question at a time (swipe or "Next" button)
      - MCQ: show options as tappable cards (single = radio, multiple = checkbox)
      - True/False: two large buttons
      - Fill in blank: text input with submit
      - Timer bar at top (animated countdown per question or total time)
      - "Submit Quiz" button on last question
      - Cannot go back to previous questions (prevents cheating)
      - Auto-submit when timer expires

   c) Results Screen (app/group/[id]/quiz/[quizId]/results.tsx):
      - Score: X/Y (percentage)
      - Time taken
      - Animated score reveal (count up animation)
      - Breakdown: correct (green), wrong (red), skipped (gray) counts
      - "Review Answers" button → shows each question with your answer, correct answer, explanation
      - "Back to Group" button
      - Streak update notification ("🔥 5 day streak!")

   d) Leaderboard (app/group/[id]/leaderboard.tsx):
      - Toggle: This Week | This Month | All Time
      - Ranked list: position, avatar, name, total score, quizzes completed
      - Current user highlighted
      - Top 3 shown with gold/silver/bronze badges
      - Animated entrance (staggered list)

3. WEEKLY CHALLENGES:
   - Challenge cards in group: title, description, deadline countdown, "Submit" button
   - Submission form: text area + optional link input
   - Show "Submitted ✓" after submission

4. STREAK SYSTEM:
   - Track consecutive days of quiz completion
   - Show streak badge on profile (🔥 + count)
   - Show streak in group leaderboard
   - Logic: if user completed a quiz today → update lastActivityDate
     - If lastActivityDate was yesterday → currentStreak++
     - If lastActivityDate is today → no change
     - If older than yesterday → currentStreak = 1
   - Update longestStreak if currentStreak > longestStreak

5. PERFORMANCE ANALYTICS (on profile or within group):
   - Total quizzes taken
   - Average accuracy %
   - Current streak + longest streak
   - Simple bar chart or stat cards showing performance over last 7 quizzes

6. ADMIN PANEL:
   a) Quiz Builder (admin-dashboard/app/admin/quizzes/new/page.tsx):
      - Form: title, group selection, type (daily/weekly/test), time settings
      - Question list: add questions one by one
      - Each question: text, type, options (add/remove), mark correct answer(s), explanation
      - Preview question
      - Publish quiz

   b) Quiz Management (admin-dashboard/app/admin/quizzes/page.tsx):
      - Table: all quizzes with group, type, questions count, attempts, avg score, status
      - Filter by group, type, date

   c) Quiz Analytics (admin-dashboard/app/admin/quizzes/[id]/page.tsx):
      - Total attempts, average score, completion rate
      - Per-question: how many got it right/wrong, most missed questions
      - Score distribution histogram (if possible, or just stats)

   d) Challenges (admin-dashboard/app/admin/challenges/):
      - Create/edit challenges with deadline
      - View submissions

STYLE GUIDELINES:
- Quiz screen: clean, focused, minimal distractions (hide tab bar during quiz)
- Timer: use animated bar or circular countdown (primary gradient color)
- Correct answer: green background with checkmark
- Wrong answer: red background with X icon
- Leaderboard: gold (#FFD700), silver (#C0C0C0), bronze (#CD7F32) for top 3
- Streak badge: 🔥 emoji with orange glow, count in bold
- Quiz cards: surface background, border, with type badge (Daily=green, Weekly=blue, Test=orange)
- Animations: score count-up, correct/wrong answer feedback, leaderboard stagger, streak celebration
- Haptic feedback: on answer selection, quiz completion, streak milestone

USE CASE:
A student in the NDA Preparation group:
- Gets a push notification at 9 AM: "Daily quiz is ready!"
- Opens the group → Quiz tab → starts the daily quiz (10 MCQs about Indian History)
- Answers each question within 30 seconds
- Sees results: 8/10 (80%), with explanations for wrong answers
- Streak counter shows 🔥 7 days!
- Checks leaderboard: they're ranked #3 this week
- On Saturday, they attempt the weekly mock test (50 questions, 60 minutes)

TEST AFTER BUILDING:
- Quiz list shows available quizzes
- Starting a quiz shows questions one at a time
- Timer counts down and auto-submits
- Results show score, breakdown, and explanations
- Streak updates correctly
- Leaderboard shows correct rankings
- Admin can create quizzes with questions
- Admin can view quiz analytics
- Challenge submission works
- Push notification for daily quiz (if configured)
```

## Testing Checklist

- [ ] Quiz list shows available quizzes in group
- [ ] Daily quiz: questions display correctly (MCQ, T/F, fill blank)
- [ ] Timer works (per-question and total)
- [ ] Auto-submit on timeout
- [ ] Cannot go back to previous questions
- [ ] Results show accurate score and breakdown
- [ ] Answer explanations display on review
- [ ] Streak increments on consecutive days
- [ ] Streak resets after missing a day
- [ ] Leaderboard shows correct rankings
- [ ] Weekly/monthly/all-time leaderboard toggles
- [ ] Challenge submission form works
- [ ] Admin quiz builder creates valid quizzes
- [ ] Admin can view per-question analytics
- [ ] Multiple quiz types work (daily, weekly, test series)
- [ ] Both themes render correctly

---

---

# PHASE 5: Intelligence & Polish

> **Goal:** Add AI assistance, personalization, performance optimization, and prepare for scale.

## Overview

This final phase adds the intelligence layer: an AI chatbot within groups (using the Gemini API already configured), a personalized feed, career recommendations, and overall polish. This phase is iterative — features can be prioritized based on user feedback.

## Prerequisites

- Phases 1A through 4 complete
- User base growing, real usage data available
- Gemini API key configured (already in `.env`)

## Feature Checklist

### Mobile App

- [ ] **AI chatbot in groups** — "@AI" mention triggers AI response in group chat, OR dedicated AI chat tab
- [ ] **AI career Q&A** — Ask career-related questions, get AI answers based on career path context
- [ ] **Personalized feed** — Feed algorithm prioritizes cards based on user's joined groups, liked cards, quiz performance
- [ ] **Career recommendations** — "Recommended for you" section on home feed based on user activity
- [ ] **Onboarding flow** — First-time user flow: select qualification → interests → get personalized suggestions
- [ ] **Multi-language support** — Hindi first (toggle in settings), then regional languages
- [ ] **Offline mode** — Cache career cards and roadmaps for offline viewing
- [ ] **Performance optimization** — Image caching, lazy loading, list virtualization audit
- [ ] **Deep linking** — Universal links for sharing career cards, groups, quizzes
- [ ] **App rating prompt** — Prompt users to rate after reaching milestones (5 quizzes, 7-day streak)

### Admin Panel

- [ ] **Analytics dashboard** — MAU, DAU, retention, engagement charts
- [ ] **AI configuration** — Enable/disable AI per group, set AI context/system prompt
- [ ] **Content performance** — Most liked/saved/shared cards, group activity rankings
- [ ] **User management** — User list, activity stats, ban/unban
- [ ] **Language management** — Translation interface for career card content
- [ ] **Push notification manager** — Create and schedule broadcast notifications
- [ ] **Export data** — Export analytics, user data, quiz results as CSV

## Schema Changes (Convex)

```typescript
// New table: aiConversations (for tracking AI interactions)
aiConversations: defineTable({
  groupId: v.id("groups"),
  userId: v.id("users"),
  query: v.string(),                         // User's question
  response: v.string(),                      // AI response
  context: v.optional(v.string()),           // Career path context provided
  createdAt: v.number(),
})
  .index("by_group", ["groupId"])
  .index("by_user", ["userId"]),

// New table: userPreferences
userPreferences: defineTable({
  userId: v.id("users"),
  language: v.optional(v.string()),          // "en" | "hi" | "mr" etc.
  qualificationLevel: v.optional(v.string()),// Selected during onboarding
  interests: v.optional(v.array(v.string())),// Career categories of interest
  onboardingComplete: v.optional(v.boolean()),
  notificationsEnabled: v.optional(v.boolean()),
  lastActiveAt: v.optional(v.number()),
})
  .index("by_user", ["userId"]),

// New table: analytics (for tracking key metrics)
analytics: defineTable({
  type: v.string(),                          // "daily_active", "signup", "quiz_taken", etc.
  value: v.number(),
  date: v.string(),                          // "2026-02-25"
  metadata: v.optional(v.string()),          // JSON string for extra data
  createdAt: v.number(),
})
  .index("by_type_and_date", ["type", "date"]),
```

## AI Prompt for Developer

```
You are building Intelligence & Polish features for the SkillMedia Expo mobile app.

PROJECT CONTEXT:
- Tech stack: React Native 0.79.5, Expo 53, Expo Router, Convex, Clerk
- All previous phases complete: auth, filters, cards, groups, chat, roadmaps, quizzes, leaderboards, streaks
- Gemini API: @google/genai package already installed, GOOGLE_GEMINI_API_KEY in .env
- Theme, UI components, animations all established

TASK — Build Intelligence features (Phase 5):

1. AI CHATBOT IN GROUPS:
   - Option A: Dedicated "AI Help" button in group → opens AI chat bottom sheet
   - Option B: "@AI" mention in group chat triggers AI response as a message
   - Use Gemini API via a Convex action (not mutation — actions can make HTTP calls)
   - Create convex/ai.ts with an action: askAI({ groupId, userId, question })
     - Fetch the career path details (FilterOption data) for context
     - Send to Gemini with system prompt: "You are a career guidance assistant for [career path]. Answer questions about preparation, exams, career prospects, and study strategies for Indian students."
     - Store the conversation in aiConversations table
     - Return AI response
   - Display AI responses with a special "AI" badge and bot avatar
   - Rate limit: max 10 AI queries per user per day

2. PERSONALIZED FEED:
   - Modify the feed query in convex/ to score and sort career cards:
     - +3 points if card's category matches user's joined groups
     - +2 points if card's qualification matches user's preference
     - +1 point if card has been liked by users in same groups
     - Fallback to ranking sort for unscored items
   - Add "Recommended for you" carousel at top of feed (5-8 cards)

3. ONBOARDING:
   - New screen: app/onboarding.tsx (shown once, after first login)
   - Step 1: Select qualification level (10th/12th/Diploma/Graduation/Post-Grad)
   - Step 2: Select 3-5 career categories of interest
   - Step 3: Welcome screen with "Start Exploring" CTA
   - Save to userPreferences table
   - Skip option available

4. ADMIN ANALYTICS DASHBOARD:
   - admin-dashboard/app/admin/analytics/page.tsx
   - Track and display: total users, daily active users, new signups (7-day trend)
   - Group stats: most active groups, groups by member count
   - Content stats: most liked cards, most joined groups
   - Quiz stats: total quizzes taken, average scores
   - Use simple stat cards + basic line chart (use recharts library in admin panel)

5. PERFORMANCE OPTIMIZATION:
   - Audit all FlatList components for proper keyExtractor, getItemLayout
   - Add expo-image caching for all avatars and card images
   - Implement pagination where missing
   - Add error boundaries around major sections
   - Test on lower-end Android devices

TEST AFTER BUILDING:
- AI responds to career questions within group context
- AI responses are relevant to the career path
- Rate limiting works (shows error after 10 queries)
- Feed shows personalized content based on user activity
- Onboarding flow works for new users
- Analytics dashboard shows real metrics
- App performance is smooth (no jank on scroll)
```

## Testing Checklist

- [ ] AI chatbot responds to career questions
- [ ] AI responses use career path context
- [ ] Rate limiting prevents excessive AI usage
- [ ] Feed shows personalized recommendations
- [ ] Onboarding flow captures preferences
- [ ] Preferences persist and affect feed
- [ ] Analytics dashboard shows real data
- [ ] App performance is acceptable on mid-range devices
- [ ] No crashes or unhandled errors
- [ ] Both themes work across all new features

---

---

# Quick Reference: All New Convex Tables by Phase

| Phase | New Tables                                                                              |
| ----- | --------------------------------------------------------------------------------------- |
| 1A    | `adminArticles`                                                                         |
| 2     | `groups`, `groupMembers`, `messages`, `reports`                                         |
| 3     | `roadmaps`, `milestones`, `roadmapSteps`, `userProgress`                                |
| 4     | `quizzes`, `questions`, `quizAttempts`, `challenges`, `challengeSubmissions`, `streaks` |
| 5     | `aiConversations`, `userPreferences`, `analytics`                                       |

**Total new tables: 17**

---

# Quick Reference: All New Screens by Phase

| Phase | Mobile Screens                                                              | Admin Screens                                           |
| ----- | --------------------------------------------------------------------------- | ------------------------------------------------------- |
| 1A    | — (modify existing)                                                         | `/admin/articles`                                       |
| 2     | `/(tabs)/groups`, `/group/[id]`, `/group/[id]/members`, `/group/[id]/info`  | `/admin/groups`, `/admin/groups/[id]`, `/admin/reports` |
| 3     | `/group/[id]/roadmap`                                                       | `/admin/roadmaps`, `/admin/roadmaps/[id]`               |
| 4     | `/group/[id]/quiz/*`, `/group/[id]/leaderboard`, `/group/[id]/challenges/*` | `/admin/quizzes/*`, `/admin/challenges/*`               |
| 5     | `/onboarding`                                                               | `/admin/analytics`                                      |

---

# Quick Reference: Admin Panel Full Feature Map

| Admin Feature                 | Phase | Page                      |
| ----------------------------- | ----- | ------------------------- |
| Filter tree management        | Done  | `/admin/filters`          |
| Post/card creation            | Done  | `/admin/posts`            |
| Ranking + vacancies fields    | 1A    | `/admin/filters` (modify) |
| Admin articles editor         | 1A    | `/admin/articles`         |
| Engagement analytics per card | 1A    | `/admin` (dashboard)      |
| Group management              | 2     | `/admin/groups`           |
| Group moderation              | 2     | `/admin/groups/[id]`      |
| Send announcements            | 2     | `/admin/groups/[id]`      |
| Reports management            | 2     | `/admin/reports`          |
| Roadmap builder               | 3     | `/admin/roadmaps`         |
| Roadmap progress analytics    | 3     | `/admin/roadmaps/[id]`    |
| Quiz builder                  | 4     | `/admin/quizzes/new`      |
| Quiz scheduling               | 4     | `/admin/quizzes/[id]`     |
| Question bank                 | 4     | `/admin/quizzes`          |
| Quiz analytics                | 4     | `/admin/quizzes/[id]`     |
| Challenge management          | 4     | `/admin/challenges`       |
| Leaderboard view              | 4     | `/admin/quizzes`          |
| AI configuration              | 5     | `/admin/settings`         |
| Analytics dashboard (MAU/DAU) | 5     | `/admin/analytics`        |
| User management               | 5     | `/admin/users`            |
| Push notification manager     | 5     | `/admin/notifications`    |

---

# Estimated Timeline

| Phase                    | Scope                                        | Estimated Time  |
| ------------------------ | -------------------------------------------- | --------------- |
| 1A: Complete Foundation  | Share, rankings, articles, card improvements | 1-2 weeks       |
| 2: Community Groups      | Groups, real-time chat, moderation           | 3-4 weeks       |
| 3: Roadmaps              | Roadmap builder, progress tracking           | 2-3 weeks       |
| 4: Quizzes & Engagement  | Quiz system, leaderboards, streaks           | 3-4 weeks       |
| 5: Intelligence & Polish | AI, personalization, analytics               | 2-3 weeks       |
| **Total**                |                                              | **11-16 weeks** |

---

_Generated: February 2026_
_Project: SkillMedia — Career Discovery Platform for Indian Students_
