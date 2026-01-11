# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

# SkillsApp

## Modern Dark Theme Career Path & Community App

### Overview
SkillsApp is a React Native + Expo application designed to help users explore career paths, view detailed guidance, and participate in a community. It features:
- Rich career path hierarchy (qualifications, categories, sectors, roles)
- Community posts and discussions
- Modern dark theme UI with neon green highlights
- Convex backend for real-time data
- Clerk authentication

---

## Features & UI Roadmap

### 1. Career Path System
- Hierarchical filter system: Qualification → Category → Sector → SubSector → Role
- Each career path includes: description, requirements, average salary, relevant exams, image
- Data seeded via Convex functions (`seedFilterOptions`)

### 2. Community System
- Users can post, comment, and save posts
- Community posts linked to career paths

### 3. Modern Dark Theme UI
- **Status Bar**: Transparent, light icons
- **Header**: Centered, bold white text, subtle shadow/gradient
- **Filter Button**: Neon green, rounded, glowing effect
- **Applied Filter Chip**: Soft grey pill, white close icon
- **Career Path Card**: Rounded, dark grey, white headings, green pill for type, balanced padding
- **Typography**: Headings bold white, body soft grey (#B0B0B0), consistent line spacing
- **Requirements**: Green check icons, indented
- **Bottom Navigation**: Minimal icons, active green, inactive grey, shadow/elevation

### 4. Backend & Data
- Convex backend with FilterOption, CommunityPost, User, Likes, SavedContent tables
- All queries and mutations implemented for real-time updates

---

## How to Run & Develop

### Prerequisites
- Node.js & npm
- Expo CLI (`npm install -g expo-cli`)
- Convex CLI (`npm install -g convex`)

### Setup Steps
1. **Clone the repo**
2. **Install dependencies**: `npm install`
3. **Configure environment**: Add `.env.local` with Clerk and Convex keys
4. **Seed database**:
   - Run: `npx convex dev` (start local Convex)
   - Run: `npm run seed` (populate database)
5. **Start app**: `npm start` (Expo Metro Bundler)
6. **Test on device**: Scan QR with Expo Go or run on emulator

---

## File Structure
- `app/(tabs)/index.tsx`: Main feed, hybrid display logic
- `components/CareerPathDetails.tsx`: Career path card, modern dark theme
- `components/FilterModal.tsx`: Hierarchical filter modal
- `convex/`: Backend functions (queries, mutations, seeding)
- `styles/`: Centralized style files for dark theme
- `constants/theme.ts`: Color palette
- `scripts/runSeeding.js`: Database seeding script

---

## Roadmap & Customization
- Add likes functionality for career paths
- Expand career path data and images
- Add notifications and user profiles
- Improve accessibility and animations
- Integrate more community features

---

## Credits & License
- Built with React Native, Expo, Convex, Clerk
- MIT License

---

## Changelog (Key Changes)
- Fixed empty FilterOption content fields
- Refactored backend queries for type safety
- Implemented hybrid display logic in frontend
- Modernized UI for dark theme with neon highlights
- Added comprehensive README and setup guide

---

For any issues or contributions, please open a GitHub issue or pull request.
