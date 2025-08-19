// convex/clearDatabase.ts
import { mutation } from "./_generated/server";

export const clearAllTables = mutation({
  args: {},
  handler: async (ctx) => {
    console.log("Starting database cleanup...");

    // Clear all tables one by one
    const tables = [
      "FilterOption",
      "likes",
      "comments",
      "savedContent",
      "notifications",
      "communityPosts",
    ];

    for (const tableName of tables) {
      try {
        const documents = await ctx.db
          .query(tableName as any)
          .collect();
        for (const doc of documents) {
          await ctx.db.delete(doc._id);
        }
        console.log(
          `Cleared ${documents.length} documents from ${tableName}`
        );
      } catch (error) {
        console.log(`Skipping ${tableName}: ${error}`);
      }
    }

    console.log("Database cleanup complete!");
    return "Database cleared successfully";
  },
});
