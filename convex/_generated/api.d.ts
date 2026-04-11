/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as adminArticles from "../adminArticles.js";
import type * as adminAuth from "../adminAuth.js";
import type * as adminFilters from "../adminFilters.js";
import type * as ai from "../ai.js";
import type * as analytics from "../analytics.js";
import type * as challenges from "../challenges.js";
import type * as clearDatabase from "../clearDatabase.js";
import type * as comments from "../comments.js";
import type * as communityPosts from "../communityPosts.js";
import type * as filter from "../filter.js";
import type * as groups from "../groups.js";
import type * as http from "../http.js";
import type * as leaderboard from "../leaderboard.js";
import type * as likes from "../likes.js";
import type * as messages from "../messages.js";
import type * as migrations from "../migrations.js";
import type * as notifications from "../notifications.js";
import type * as posts from "../posts.js";
import type * as pushNotifications from "../pushNotifications.js";
import type * as questions from "../questions.js";
import type * as quizAttempts from "../quizAttempts.js";
import type * as quizzes from "../quizzes.js";
import type * as reports from "../reports.js";
import type * as roadmaps from "../roadmaps.js";
import type * as savedContent from "../savedContent.js";
import type * as seedData from "../seedData.js";
import type * as streaks from "../streaks.js";
import type * as userPreferences from "../userPreferences.js";
import type * as users from "../users.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  adminArticles: typeof adminArticles;
  adminAuth: typeof adminAuth;
  adminFilters: typeof adminFilters;
  ai: typeof ai;
  analytics: typeof analytics;
  challenges: typeof challenges;
  clearDatabase: typeof clearDatabase;
  comments: typeof comments;
  communityPosts: typeof communityPosts;
  filter: typeof filter;
  groups: typeof groups;
  http: typeof http;
  leaderboard: typeof leaderboard;
  likes: typeof likes;
  messages: typeof messages;
  migrations: typeof migrations;
  notifications: typeof notifications;
  posts: typeof posts;
  pushNotifications: typeof pushNotifications;
  questions: typeof questions;
  quizAttempts: typeof quizAttempts;
  quizzes: typeof quizzes;
  reports: typeof reports;
  roadmaps: typeof roadmaps;
  savedContent: typeof savedContent;
  seedData: typeof seedData;
  streaks: typeof streaks;
  userPreferences: typeof userPreferences;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
