# SkillMedia App — Features & Changes Documentation

## Overview

SkillMedia is a career-focused social platform built with **React Native (Expo)** for mobile and **Next.js** for the admin dashboard. The backend runs on **Convex** (real-time database) with **Clerk** authentication. The app helps users discover career paths, read expert posts, and engage with a community through discussions, likes, comments, and bookmarks.

---

## Recent Changes (February 2026)

### 1. Admin Dashboard
- Built a full **Next.js admin dashboard** (`admin-dashboard/`) with Clerk auth
- Manage posts, users, filters, and seed data from a web interface
- Deployed alongside the Convex backend (`tidy-gnat-566`)

### 2. Design System & Theming
- **Typography system** (`constants/Typography.ts`) — centralized font sizes, weights, line heights
- **Spacing system** (`constants/Spacing.ts`) — t-shirt scale (`xs` through `6xl`) used app-wide
- **CardStyles system** (`constants/CardStyles.ts`) — `baseCard`, `elevatedCard`, `flatCard` presets
- **Colors system** (`constants/Colors.ts`) — modern light/dark palette with primary, secondary, accent, surface, and semantic colors
- **Theme integration** (`constants/theme.ts`) — `createTheme()` function producing a complete theme object with colors, typography, spacing, borderRadius, shadows, and animation presets
- **ThemeProvider** (`providers/ThemeProvider.tsx`) — React context with `useTheme()`, `useThemedStyles()`, and dark mode toggle

### 3. Typography & Spacing Migration
- **17 files** migrated to use `<Typography>` component instead of raw `<Text>` with inline font styles
- **13 files** migrated from hard-coded pixel values to theme spacing tokens
- **8 card components** updated to use CardStyles constants
- Font sizes reduced for compact feel: display 24px, h1 20px, h2 18px, h3 16px, body 15px, bodySmall 13px, caption 11px

### 4. UI Component Library (`components/ui/`)

| Component | Description |
|-----------|-------------|
| `Typography` | Themed text with variant, color, and weight props |
| `AnimatedCard` | Pressable card wrapper with fade-in animation; supports `default`, `elevated`, `flat`, `transparent` variants |
| `AnimatedButton` | Themed button with `primary`, `secondary`, `outline`, `ghost`, `danger` variants |
| `AnimatedLikeButton` | Heart icon with scale animation, particle burst, and haptic feedback |
| `FloatingActionButton` | Circular FAB with Ionicons, positioned bottom-right |
| `FilterChip` | Pill-shaped tag for displaying/removing active filters |
| `FilterChipsBar` | Horizontally scrollable row of FilterChips with clear-all |
| `ProgressBar` | Animated progress indicator used in FilterModal wizard |
| `SelectableCardGrid` | Multi-column grid of selectable option cards |
| `SkeletonLoader` | Shimmer placeholder components (`PostSkeleton`, `ProfileSkeleton`, etc.) replacing the basic loader |
| `EmptyState` | Reusable empty-state illustration integrated across all screens |
| `Toast` | Theme-aware notification toast with blur background, Ionicons, reanimated entry/exit, progress bar, max 3 queue |
| `GlassCard` | Glassmorphic card with blur background |
| `GradientButton` | Gradient-styled button |
| `NeumorphicInput` | Soft-shadow input field |
| `ThemeToggle` | Light/dark mode switch |

### 5. Card Components (`components/cards/`)

| Component | Description |
|-----------|-------------|
| `CareerPathHeroCard` | Full-width edge-to-edge hero with gradient overlay, no border radius |
| `PostCardVariants` | `ExpertPostCard` (accent bar + expert badge) and `DiscussionPostCard` (community-style) — both full-width, Instagram layout |

### 6. Tab Navigation
- **4-tab layout**: Feed, Bookmarks, Notifications, Profile
- **Solid tab bar** — edge-to-edge, 60px height, 1px top border, no blur/glass/shadows
- **TabIcon** with scale animation and active glow dot
- Cleaned up hidden `index_new` screen reference

### 7. Dual Feed Layout (`app/(tabs)/index.tsx`)
- **Filtered mode**: Hero card at top + filtered post list when filters are active
- **Explore mode**: Full FlatList of all posts when no filters applied
- **Three-way card rendering**: CommunityPost, ExpertPostCard, DiscussionPostCard based on post type and `isAdmin` enrichment
- **Instagram-style post cards** — no card backgrounds, no shadows, no border radius; 1px separator lines; `paddingHorizontal: 16` inside content sections

### 8. FilterModal Wizard (`components/FilterModal.tsx`)
- **@gorhom/bottom-sheet** based — snap points at 55% and 90%, swipe-to-dismiss
- **Breadcrumb navigation** through filter levels (up to 6 steps)
- **ProgressBar** indicator at each step
- **SelectableCardGrid** for option selection with slide transitions
- **Minimal icon-based action bar** (44px) replacing old 3-button layout:
  - `chevron-back` — go back (shown when level > 0)
  - Step counter text — "Step N of 6"
  - `close-circle-outline` — clear selections (shown when filters exist)
  - `checkmark-circle` — apply filters (always visible)
  - Haptic feedback on all actions

### 9. Pull-to-Refresh
- **Career facts** — random fun fact banner during refresh
- **Spinning compass** animation on header icon
- **Animated banner** with fade-in
- **progressViewOffset** to prevent spinner overlapping content

### 10. Micro-Interactions & Animations
- **Staggered entrance animations** (FadeInDown) on feed, bookmarks, notifications, profile — with `isFirstLoad` gating and 500ms delay cap
- **AnimatedLikeButton** — heart scale + particle burst + expo-haptics
- **Button press animations** — spring scale on profile edit button
- **GestureHandlerRootView** wrapping entire app for bottom sheet gesture support

### 11. Toast Notification System
- Global `showToast(message, type)` via `ToastProvider` in root layout
- Types: `success`, `error`, `info`, `warning`
- Blur background, Ionicons, reanimated slide + fade, auto-dismiss progress bar
- Max 3 queued toasts

### 12. Profile Screen
- **Compact vertical layout**: 72px avatar → stats row (12px gap) → name (8px gap) → bio (2-line truncated) → edit button (36px, border-only) → post grid (16px gap)
- Removed share button, reduced all spacing to Instagram-tight density
- Stats: numbers at 18px, labels at 12px muted gray
- Edit Profile: full-width, transparent fill, 1px border, 8px radius

### 13. Code Quality Cleanup
- **Fixed 42 type errors** across all 5 style files — migrated `COLORS.white` → `COLORS.text`, `COLORS.grey` → `COLORS.textMuted`, `COLORS.lightGray` → `COLORS.border`
- **Removed unused imports**: `ComponentSpacing` from `profile.styles.ts` and `create.styles.ts`
- **Deleted 7 unused files**:
  - `styles/create.styles.ts` — never imported
  - `components/UIComponentsDemo.tsx` — standalone demo, never rendered
  - `convex/likesTemp.ts` + `admin-dashboard/convex/likesTemp.ts` — temp stubs
  - `convex/schema_new.ts` + `admin-dashboard/convex/schema_new.ts` — draft schemas, not active
  - `app/(tabs)/index_new.tsx` — dead hidden tab, removed from layout

---

## Current Folder Structure

```
SkillsAppNew/
├── app/                          # Expo Router screens
│   ├── _layout.tsx               # Root layout (GestureHandler + Toast + SafeArea)
│   ├── index.tsx                 # Entry redirect
│   ├── (auth)/
│   │   └── login.tsx             # Clerk Google login
│   ├── (tabs)/
│   │   ├── _layout.tsx           # Tab navigator (4 tabs, solid bar)
│   │   ├── index.tsx             # Main feed (dual-mode)
│   │   ├── bookmarks.tsx         # Saved content
│   │   ├── notifications.tsx     # Activity feed
│   │   └── profile.tsx           # User profile (compact)
│   └── user/
│       ├── _layout.tsx
│       └── [id].tsx              # Other user profiles
│
├── components/
│   ├── CareerPathDetails.tsx     # Career path detail view
│   ├── Comment.tsx               # Single comment
│   ├── CommentsModal.tsx         # Comments bottom sheet
│   ├── CommunityPost.tsx         # Instagram-style post card
│   ├── FilterChipsBar.tsx        # Active filter chips row
│   ├── FilterModal.tsx           # Bottom sheet filter wizard
│   ├── InitialLayout.tsx         # Auth gate
│   ├── Loader.tsx                # Loading spinner
│   ├── NoPostsFound.tsx          # Empty feed state
│   ├── Notification.tsx          # Notification item
│   ├── Post.tsx                  # Legacy post component
│   ├── cards/
│   │   ├── CareerPathHeroCard.tsx
│   │   └── PostCardVariants.tsx  # Expert + Discussion cards
│   └── ui/
│       ├── AnimatedButton.tsx
│       ├── AnimatedCard.tsx
│       ├── AnimatedLikeButton.tsx
│       ├── EmptyState.tsx
│       ├── FilterChip.tsx
│       ├── FloatingActionButton.tsx
│       ├── GlassCard.tsx
│       ├── GradientButton.tsx
│       ├── NeumorphicInput.tsx
│       ├── ProgressBar.tsx
│       ├── SelectableCardGrid.tsx
│       ├── SkeletonLoader.tsx
│       ├── ThemeToggle.tsx
│       ├── Toast.tsx
│       ├── Typography.tsx
│       └── index.ts
│
├── constants/
│   ├── CardStyles.ts             # Card style presets
│   ├── Colors.ts                 # Light/dark color palettes
│   ├── Spacing.ts                # Spacing scale
│   ├── theme.ts                  # createTheme() + exports
│   └── Typography.ts             # Font size/weight constants
│
├── convex/                       # Backend (Convex)
│   ├── schema.ts                 # Active database schema
│   ├── posts.ts                  # Post queries/mutations
│   ├── users.ts                  # User queries/mutations
│   ├── comments.ts               # Comments
│   ├── likes.ts                  # Likes
│   ├── notifications.ts          # Notifications
│   ├── savedContent.ts           # Bookmarks
│   ├── communityPosts.ts         # Community posts
│   ├── filter.ts                 # Filter queries
│   ├── adminAuth.ts              # Admin auth helpers
│   ├── adminFilters.ts           # Admin filter management
│   ├── seedData.ts               # Seed data functions
│   ├── clearDatabase.ts          # DB cleanup
│   ├── migrations.ts             # Schema migrations
│   └── http.ts                   # HTTP routes (Clerk webhooks)
│
├── providers/
│   ├── ClerkAndConvexProvider.tsx # Auth + DB provider
│   └── ThemeProvider.tsx          # Theme context
│
├── styles/                       # Legacy static stylesheets
│   ├── auth.styles.ts
│   ├── feed.styles.ts
│   ├── notifications.styles.ts
│   └── profile.styles.ts
│
├── types/
│   └── index.ts                  # Shared TypeScript types
│
├── admin-dashboard/              # Next.js admin panel
│   ├── app/                      # Next.js App Router pages
│   ├── components/               # Admin UI components
│   ├── convex/                   # Mirrored Convex functions
│   └── lib/                      # Utilities
│
├── scripts/                      # CLI seed scripts
│   ├── seedFilters.ts
│   ├── seedPosts.ts
│   └── runSeeding.js
│
├── docs/
│   ├── APP_FULL_REPORT.md
│   └── features.md               # ← This file
│
└── assets/
    ├── fonts/
    └── images/
```

---

## Next Phases

### Phase 1 — Content & Engagement
- [ ] Image upload for community posts (Convex file storage)
- [ ] Rich text / markdown support in post bodies
- [ ] Comment replies (threaded conversations)
- [ ] User follow / unfollow system
- [ ] Push notifications via Expo Notifications

### Phase 2 — Discovery & Personalization
- [ ] Search screen (posts, users, career paths)
- [ ] Personalized feed algorithm based on filter selections
- [ ] Trending / popular posts section
- [ ] Career path progress tracking with milestones

### Phase 3 — Polish & Performance
- [ ] Image caching and optimization
- [ ] Infinite scroll pagination for large feeds
- [ ] Offline support with local cache
- [ ] App splash screen and onboarding flow
- [ ] Accessibility audit (screen reader, dynamic text)

### Phase 4 — Admin & Analytics
- [ ] Admin dashboard analytics (user growth, engagement metrics)
- [ ] Content moderation tools (report, flag, review queue)
- [ ] A/B testing framework for UI experiments
- [ ] Export data / reporting features
