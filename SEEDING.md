# SkillsApp Database Seeding

This document explains how to seed your SkillsApp database with initial filter options and sample posts.

## Quick Start

Run the automated seeding script:

```bash
npm run seed
```

This will:

1. Clear existing filter options and posts
2. Create a hierarchical filter system (qualifications → categories → sectors → subsectors → branches → roles)
3. Add sample job posts with proper filter associations
4. Create an admin user if none exists

## Manual Seeding

If you prefer to run commands individually:

```bash
# Seed filter options first
npm run seed-filters

# Then seed sample posts
npm run seed-posts
```

Or use Convex CLI directly:

```bash
npx convex run seedData:seedFilters
npx convex run seedData:seedPosts
```

## Environment Setup

Ensure these environment variables are set in your `.env` file:

```env
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
CONVEX_DEPLOYMENT=dev:your-deployment
EXPO_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
CONVEX_ADMIN_KEY=your_admin_key
```

## Filter Hierarchy

The seeding creates this filter structure:

```
Qualification (Root Level)
├── Graduation
│   ├── Government Jobs
│   │   ├── Defence Services
│   │   │   ├── Indian Navy
│   │   │   │   ├── Executive Branch
│   │   │   │   │   ├── SSC Pilot (Navy)
│   │   │   │   │   ├── SSC Observer (Navy)
│   │   │   │   │   └── SSC Logistics (Navy)
│   │   │   │   └── Engineering Branch
│   │   │   ├── Indian Army
│   │   │   ├── Indian Air Force
│   │   │   └── Paramilitary Forces
│   │   ├── Government Banking
│   │   ├── Indian Railways
│   │   └── Civil Services
│   └── Private Jobs
│       ├── IT & Software
│       │   ├── Software Development
│       │   │   ├── Frontend Development
│       │   │   │   ├── React Developer
│       │   │   │   ├── Vue.js Developer
│       │   │   │   ├── Angular Developer
│       │   │   │   └── UI/UX Designer
│       │   │   ├── Backend Development
│       │   │   │   ├── Node.js Developer
│       │   │   │   ├── Python Developer
│       │   │   │   └── Java Developer
│       │   │   └── Full Stack Development
│       │   ├── Data Science & AI
│       │   └── Cybersecurity
│       ├── Manufacturing
│       ├── Private Finance
│       └── Retail & E-commerce
├── 12th Standard
├── 10th Standard
└── Diploma
```

## Sample Posts

The seeding creates these sample job posts:

1. **SSC Pilot Vacancy – Indian Navy** - Government defence job
2. **Junior React Developer** - Private IT job for React development
3. **Python Backend Developer** - Private fintech backend position

## Files Changed/Added

### New Files:

- `convex/seedData.ts` - Contains seeding mutations
- `convex/migrations.ts` - Database migration functions
- `scripts/runSeeding.js` - Automated seeding script
- `.env` - Environment variables

### Modified Files:

- `convex/schema.ts` - Updated to handle legacy data
- `package.json` - Added seeding scripts
- `scripts/seedFilters.ts` - Deprecated, shows migration path
- `scripts/seedPosts.ts` - Deprecated, shows migration path

## Troubleshooting

### Schema Validation Errors

If you encounter schema validation errors, run the migration:

```bash
npx convex run migrations:clearInvalidNotifications
```

### Missing Environment Variables

Ensure all required environment variables are set in `.env`

### TypeScript Errors

The schema was made flexible to handle legacy data. If you see TypeScript errors in existing functions, they should be resolved with proper null checks.

## Development Notes

- The old `seedFilters.ts` and `seedPosts.ts` files are deprecated
- Use the new Convex mutation-based approach for seeding
- The schema is flexible to handle both old and new data formats
- All seeding is idempotent - you can run it multiple times safely
