#!/usr/bin/env node

/**
 * Seeding script for SkillsApp
 * This script calls Convex mutations to seed the database with initial data
 */

const { execSync } = require("child_process");

console.log("🚀 SkillsApp Data Seeding");
console.log("======================\n");

// Check if we're in the correct directory
if (!require("fs").existsSync("./convex")) {
  console.error(
    "❌ Error: convex directory not found. Please run this from the project root."
  );
  process.exit(1);
}

try {
  console.log("📊 Seeding filter options...");
  execSync("npx convex run seedData:seedFilters", {
    stdio: "inherit",
  });

  console.log("\n📝 Seeding sample posts...");
  execSync("npx convex run seedData:seedPosts", {
    stdio: "inherit",
  });

  console.log(
    "\n✅ Database seeding completed successfully!"
  );
  console.log("\n📱 You can now run your app with:");
  console.log("   npm start");
} catch (error) {
  console.error("\n❌ Seeding failed:", error.message);
  console.log("\n🔧 Manual seeding instructions:");
  console.log(
    "1. Ensure Convex is running: npx convex dev"
  );
  console.log(
    "2. Seed filters: npx convex run seedData:seedFilters"
  );
  console.log(
    "3. Seed posts: npx convex run seedData:seedPosts"
  );
  process.exit(1);
}
