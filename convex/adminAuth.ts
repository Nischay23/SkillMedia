// convex/adminAuth.ts

import { UserIdentity } from "convex/server";
import { Id } from "./_generated/dataModel";
import { MutationCtx, QueryCtx } from "./_generated/server";

/**
 * Security Layer: Validates admin access
 * Throws Error if user is not authenticated or not an admin
 *
 * @returns userId and identity if user is admin
 * @throws Error if unauthenticated or not admin
 */
export async function getAdmin(
  ctx: QueryCtx | MutationCtx
): Promise<{
  userId: Id<"users">;
  identity: UserIdentity;
}> {
  // 1. Check authentication
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Unauthenticated: Please log in");
  }

  // 2. Get user from Convex database
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) =>
      q.eq("clerkId", identity.subject)
    )
    .unique();

  if (!user) {
    throw new Error("User not found in database");
  }

  // 3. Verify admin status
  if (!user.isAdmin) {
    throw new Error("Forbidden: Admin access required");
  }

  return {
    userId: user._id,
    identity,
  };
}

/**
 * Optional: Check admin status without throwing
 * Useful for conditional UI rendering
 *
 * @returns true if user is admin, false otherwise
 */
export async function isAdmin(
  ctx: QueryCtx | MutationCtx
): Promise<boolean> {
  try {
    await getAdmin(ctx);
    return true;
  } catch {
    return false;
  }
}
