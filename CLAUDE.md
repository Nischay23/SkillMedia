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