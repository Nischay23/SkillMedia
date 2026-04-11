// convex/ai.ts
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { Doc, Id } from "./_generated/dataModel";
import {
  action,
  internalMutation,
  internalQuery,
  query,
} from "./_generated/server";

// Type definitions to break circular reference
type UserDoc = Doc<"users">;
type FilterOptionDoc = Doc<"FilterOption">;
type GroupDoc = Doc<"groups">;

interface GroupWithCareerPath {
  group: GroupDoc;
  filterOption: FilterOptionDoc | null;
}

// Internal query to get current user
export const getCurrentUser = internalQuery({
  args: { clerkId: v.string() },
  handler: async (ctx, args): Promise<UserDoc | null> => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) =>
        q.eq("clerkId", args.clerkId),
      )
      .first();
  },
});

// Internal query to get group with career path details
export const getGroupWithCareerPath = internalQuery({
  args: { groupId: v.id("groups") },
  handler: async (
    ctx,
    args,
  ): Promise<GroupWithCareerPath | null> => {
    const group = await ctx.db.get(args.groupId);
    if (!group) return null;

    const filterOption = await ctx.db.get(
      group.filterOptionId,
    );
    return {
      group,
      filterOption,
    };
  },
});

// Internal query to count today's AI conversations for a user
export const getTodayAIConversationCount = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args): Promise<number> => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = today.getTime();

    const conversations = await ctx.db
      .query("aiConversations")
      .withIndex("by_user", (q) =>
        q.eq("userId", args.userId),
      )
      .filter((q) =>
        q.gte(q.field("createdAt"), todayStart),
      )
      .collect();

    return conversations.length;
  },
});

// Internal mutation to save AI conversation
export const saveAIConversation = internalMutation({
  args: {
    groupId: v.id("groups"),
    userId: v.id("users"),
    question: v.string(),
    answer: v.string(),
  },
  handler: async (
    ctx,
    args,
  ): Promise<Id<"aiConversations">> => {
    return await ctx.db.insert("aiConversations", {
      groupId: args.groupId,
      userId: args.userId,
      question: args.question,
      answer: args.answer,
      createdAt: Date.now(),
    });
  },
});

// Main action: Ask AI about career path
export const askAI = action({
  args: {
    groupId: v.id("groups"),
    question: v.string(),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{
    answer: string;
    remainingQueries: number;
  }> => {
    // 1. Get current user using server-side auth
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return {
        answer: "User authentication error. Please log in again.",
        remainingQueries: 0,
      };
    }

    const user = (await ctx.runQuery(
      internal.ai.getCurrentUser,
      {
        clerkId: identity.subject,
      },
    )) as UserDoc | null;

    if (!user) {
      return {
        answer:
          "User authentication error. Please log in again.",
        remainingQueries: 0,
      };
    }

    // 2. Check rate limit
    const todayCount = (await ctx.runQuery(
      internal.ai.getTodayAIConversationCount,
      {
        userId: user._id,
      },
    )) as number;

    // FRIENDLY FIX: Don't crash, just return a friendly message
    if (todayCount >= 10) {
      return {
        answer:
          "You've reached your daily limit of 10 AI questions. Please come back tomorrow! 🌟",
        remainingQueries: 0,
      };
    }

    // 3. Get group and career path details
    const groupData = (await ctx.runQuery(
      internal.ai.getGroupWithCareerPath,
      {
        groupId: args.groupId,
      },
    )) as GroupWithCareerPath | null;

    if (!groupData || !groupData.filterOption) {
      return {
        answer:
          "Sorry, I couldn't find the career details for this group.",
        remainingQueries: 10 - todayCount,
      };
    }

    const filterOption = groupData.filterOption;
    const careerPathName = filterOption.name;
    const careerDescription =
      filterOption.description ||
      "No description available";
    const requirements =
      filterOption.requirements || "Not specified";
    const avgSalary =
      filterOption.avgSalary || "Not specified";
    const relevantExams =
      filterOption.relevantExams || "Not specified";

    // 4. Call Gemini API
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      return {
        answer:
          "AI service is currently not configured by the admin.",
        remainingQueries: 10 - todayCount,
      };
    }

    const prompt = `You are a career guidance assistant for "${careerPathName}" career path in India.
Career details: ${careerDescription}
Requirements: ${requirements}
Average Salary: ${avgSalary}
Relevant Exams: ${relevantExams}

Answer this question from a student: ${args.question}

Keep answer concise (max 150 words), practical, and specific to Indian context.
Focus on actionable advice.`;

    try {
      // FIX: Changed back to gemini-2.0-flash as it is the correct model for your key
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
        },
      );

      // FRIENDLY FIX: Handle Google API Limits Gracefully
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Gemini API error:", errorText);

        // Check if it's the 429 Quota Exceeded error
        if (
          response.status === 429 ||
          errorText.includes("429")
        ) {
          return {
            answer:
              "I'm receiving too many questions right now! Please wait about 60 seconds and try again. ⏳",
            remainingQueries: 10 - todayCount, // Don't deduct a query for a failed attempt
          };
        }

        // Generic fallback error
        return {
          answer:
            "My AI brain is having a temporary hiccup connecting to Google. Please try again later! 🧠⚡",
          remainingQueries: 10 - todayCount,
        };
      }

      const data = (await response.json()) as {
        candidates?: {
          content?: { parts?: { text?: string }[] };
        }[];
      };
      const answer =
        data.candidates?.[0]?.content?.parts?.[0]?.text ||
        "Unable to generate response";

      // 5. Save conversation (Only save if successful)
      await ctx.runMutation(
        internal.ai.saveAIConversation,
        {
          groupId: args.groupId,
          userId: user._id,
          question: args.question,
          answer,
        },
      );

      // 6. Return response with remaining queries
      return {
        answer,
        remainingQueries: 10 - todayCount - 1,
      };
    } catch (error) {
      console.error("AI request failed:", error);
      // FRIENDLY FIX: Catch absolute network failures
      return {
        answer:
          "Oops! Something went wrong connecting to the AI. Please check your internet and try again. 🛠️",
        remainingQueries: 10 - todayCount,
      };
    }
  },
});

// Query: Get AI conversation history for a group
export const getAIHistory = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) =>
        q.eq("clerkId", identity.subject),
      )
      .first();
    if (!user) return [];

    const conversations = await ctx.db
      .query("aiConversations")
      .withIndex("by_group", (q) =>
        q.eq("groupId", args.groupId),
      )
      .filter((q) => q.eq(q.field("userId"), user._id))
      .order("desc")
      .take(20);

    return conversations;
  },
});

// Query: Get remaining AI queries for today
export const getRemainingAIQueries = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return 0;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) =>
        q.eq("clerkId", identity.subject),
      )
      .first();
    if (!user) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = today.getTime();

    const conversations = await ctx.db
      .query("aiConversations")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) =>
        q.gte(q.field("createdAt"), todayStart),
      )
      .collect();

    return Math.max(0, 10 - conversations.length);
  },
});
