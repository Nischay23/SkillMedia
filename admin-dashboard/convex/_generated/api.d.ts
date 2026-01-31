/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as adminAuth from "../adminAuth.js";
import type * as adminFilters from "../adminFilters.js";
import type * as clearDatabase from "../clearDatabase.js";
import type * as comments from "../comments.js";
import type * as communityPosts from "../communityPosts.js";
import type * as filter from "../filter.js";
import type * as http from "../http.js";
import type * as likesTemp from "../likesTemp.js";
import type * as migrations from "../migrations.js";
import type * as notifications from "../notifications.js";
import type * as posts from "../posts.js";
import type * as savedContent from "../savedContent.js";
import type * as schema_new from "../schema_new.js";
import type * as seedData from "../seedData.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  adminAuth: typeof adminAuth;
  adminFilters: typeof adminFilters;
  clearDatabase: typeof clearDatabase;
  comments: typeof comments;
  communityPosts: typeof communityPosts;
  filter: typeof filter;
  http: typeof http;
  likesTemp: typeof likesTemp;
  migrations: typeof migrations;
  notifications: typeof notifications;
  posts: typeof posts;
  savedContent: typeof savedContent;
  schema_new: typeof schema_new;
  seedData: typeof seedData;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
