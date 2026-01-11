# Admin Dashboard Feature - Technical Specification

**Version:** 1.0  
**Date:** January 11, 2026  
**Status:** Design Phase  
**Author:** Development Team

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Problem Statement](#problem-statement)
3. [Feature Overview](#feature-overview)
4. [Architecture & Design Principles](#architecture--design-principles)
5. [Security Model](#security-model)
6. [Database Schema Changes](#database-schema-changes)
7. [Backend API Specification](#backend-api-specification)
8. [Frontend Components Architecture](#frontend-components-architecture)
9. [Implementation Roadmap](#implementation-roadmap)
10. [Performance Optimization](#performance-optimization)
11. [Security Checklist](#security-checklist)
12. [Testing Strategy](#testing-strategy)
13. [Rollback Plan](#rollback-plan)
14. [Future Enhancements](#future-enhancements)

---

## Executive Summary

### Current State

- FilterOption hierarchy is managed via manual seeding scripts (`seedData.ts`)
- Adding/modifying career paths requires code changes
- Admin posts are created through regular user flow (admin flag exists but no special UI)
- No dynamic content management system
- Schema supports 6-level hierarchy but no validation layer

### Proposed Solution

A **secure, scalable admin dashboard** that enables authorized administrators to:

- Dynamically manage the 6-level FilterOption hierarchy
- Create and link admin posts to specific career paths
- Toggle content visibility without data deletion
- Validate hierarchy rules on the backend
- Replace manual seeding for day-to-day operations

### Success Metrics

- ✅ Zero code deployments required for content updates
- ✅ Sub-500ms response time for filter tree operations
- ✅ 100% backend validation coverage for hierarchy rules
- ✅ Zero breaking changes to existing user flows
- ✅ Audit trail for all admin actions

---

## Problem Statement

### Pain Points

1. **Content Management Friction**

   - Adding "Cybersecurity Analyst" role requires:
     - Editing `seedData.ts`
     - Finding correct parent IDs
     - Deploying code changes
     - Running seed mutation
   - Risk of breaking existing hierarchy
   - No rollback mechanism

2. **No Validation Enforcement**

   - Manual seeding can create invalid hierarchies
   - Example: accidentally creating `role → qualification` (invalid)
   - No type enforcement beyond schema definition

3. **Limited Admin Capabilities**

   - `isAdmin` flag exists but no distinct UI
   - Admins use same create flow as regular users (who can't actually post)
   - No way to link posts to specific filter nodes during creation

4. **Scalability Concerns**
   - Current approach doesn't scale to 1000+ career paths
   - No bulk operations
   - No search within admin tools

### Business Impact

- Slow time-to-market for new career content
- High developer dependency for content updates
- Risk of data corruption
- Poor admin user experience

---

## Feature Overview

### Core Capabilities

```
┌─────────────────────────────────────────────────────────────┐
│                    ADMIN DASHBOARD                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📊 Filter Hierarchy Manager                               │
│  ├─ Tree View (all 6 levels)                              │
│  ├─ Node Editor (dynamic fields)                          │
│  ├─ Add Child (type auto-determined)                      │
│  ├─ Toggle Active/Inactive                                │
│  └─ Search & Filter                                        │
│                                                             │
│  📝 Admin Post Manager                                      │
│  ├─ Create with Filter Linking                            │
│  ├─ Edit Existing Posts                                   │
│  ├─ Bulk Operations                                       │
│  └─ Preview Before Publish                                │
│                                                             │
│  📈 Analytics Dashboard (Future)                           │
│  └─ Engagement metrics per filter node                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### User Roles

| Role                     | Capabilities                                          | Access                 |
| ------------------------ | ----------------------------------------------------- | ---------------------- |
| **Regular User**         | View content, like, comment, save                     | All user-facing routes |
| **Admin**                | All user capabilities + manage filters + create posts | All routes + `/admin`  |
| **Super Admin** (Future) | Admin capabilities + user management                  | All routes             |

---

## Architecture & Design Principles

### Guiding Principles

1. **Non-Destructive Changes**

   - All operations are additive
   - No schema breaking changes
   - Soft deletes only (`isActive: false`)
   - Existing user flows remain untouched

2. **Backend-First Validation**

   - All hierarchy rules enforced in Convex mutations
   - Frontend is optimistic but not authoritative
   - Edge cases handled server-side

3. **Performance by Design**

   - Single query for entire tree (O(1) network calls)
   - Client-side tree building (O(n) time complexity)
   - No N+1 query problems
   - Optimistic UI updates

4. **Separation of Concerns**

   ```
   Frontend (React Native)
   ├─ Presentation Layer (components/admin/*)
   ├─ State Management (React hooks)
   └─ Optimistic Updates

   Backend (Convex)
   ├─ Authentication Layer (adminAuth.ts)
   ├─ Business Logic (adminFilters.ts, adminPosts.ts)
   ├─ Validation Layer (hierarchy rules)
   └─ Data Access (queries/mutations)
   ```

5. **Progressive Disclosure**
   - Admin route hidden from regular users
   - No tab bar modifications
   - Direct navigation only (`/admin`)

---

## Security Model

### Authentication Flow

```typescript
// convex/adminAuth.ts

import { UserIdentity } from "convex/server";
import { QueryCtx, MutationCtx } from "./_generated/server";

/**
 * Security Layer: Validates admin access
 * Throws AuthenticationError if user is not admin
 */
export async function getAdmin(
  ctx: QueryCtx | MutationCtx
): Promise<{ userId: string; identity: UserIdentity }> {
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
```

### Security Rules

1. **All admin mutations must call `getAdmin(ctx)` first**
2. **No client-side admin checks (UI only)**
3. **Admin status stored in Convex `users` table, not Clerk metadata**
4. **Audit logging for all admin actions** (future enhancement)

### Attack Surface Mitigation

| Threat                | Mitigation                           |
| --------------------- | ------------------------------------ |
| Unauthorized access   | Backend validation on every mutation |
| Privilege escalation  | Admin flag not user-editable         |
| Data deletion         | Soft deletes only                    |
| Hierarchy corruption  | Strict validation rules              |
| XSS via admin content | Content sanitization                 |
| CSRF                  | Convex handles auth tokens           |

---

## Database Schema Changes

### No Breaking Changes Required ✅

Current schema already supports all required fields:

```typescript
// convex/schema.ts (existing - no changes needed)

FilterOption: defineTable({
  name: v.string(),
  type: v.union(
    v.literal("qualification"),
    v.literal("category"),
    v.literal("sector"),
    v.literal("subSector"),
    v.literal("branch"),
    v.literal("role")
  ),
  parentId: v.optional(v.id("FilterOption")),

  // Content fields
  description: v.optional(v.string()),
  requirements: v.optional(v.string()),
  avgSalary: v.optional(v.string()),
  relevantExams: v.optional(v.string()),
  image: v.optional(v.string()),

  // Engagement
  likes: v.optional(v.number()),
  comments: v.optional(v.number()),
  isActive: v.optional(v.boolean()), // ✅ Already exists
}).index("by_parentId", ["parentId"]); // ✅ Perfect for tree queries
```

### Optional Enhancement: Add Metadata

```typescript
// OPTIONAL: For audit trail (future enhancement)
FilterOption: defineTable({
  // ... existing fields ...

  // Audit fields (optional)
  createdBy: v.optional(v.id("users")),
  createdAt: v.optional(v.number()),
  updatedBy: v.optional(v.id("users")),
  updatedAt: v.optional(v.number()),
});
```

**Decision:** Implement in Phase 2 to keep initial scope minimal.

---

## Backend API Specification

### File: `convex/adminFilters.ts`

#### Query: `getAllFilters`

**Purpose:** Fetch entire filter hierarchy in one call

```typescript
import { query } from "./_generated/server";
import { getAdmin } from "./adminAuth";

export const getAllFilters = query({
  args: {},
  handler: async (ctx) => {
    // Security check
    await getAdmin(ctx);

    // Fetch ALL filters (including inactive for admin view)
    const filters = await ctx.db
      .query("FilterOption")
      .collect();

    return filters.map((f) => ({
      _id: f._id,
      name: f.name,
      type: f.type,
      parentId: f.parentId,
      description: f.description,
      requirements: f.requirements,
      avgSalary: f.avgSalary,
      relevantExams: f.relevantExams,
      image: f.image,
      isActive: f.isActive ?? true,
      likes: f.likes ?? 0,
      comments: f.comments ?? 0,
    }));
  },
});
```

**Performance:** O(n) where n = total filter nodes (~500-1000 expected)

---

#### Mutation: `createFilterNode`

**Purpose:** Add new node to hierarchy

```typescript
import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAdmin } from "./adminAuth";

export const createFilterNode = mutation({
  args: {
    name: v.string(),
    type: v.union(
      v.literal("qualification"),
      v.literal("category"),
      v.literal("sector"),
      v.literal("subSector"),
      v.literal("branch"),
      v.literal("role")
    ),
    parentId: v.optional(v.id("FilterOption")),
    description: v.optional(v.string()),
    requirements: v.optional(v.string()),
    avgSalary: v.optional(v.string()),
    relevantExams: v.optional(v.string()),
    image: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // 1. Security check
    await getAdmin(ctx);

    // 2. Validation: name cannot be empty
    if (!args.name.trim()) {
      throw new Error("Name cannot be empty");
    }

    // 3. Validation: parent must exist (if provided)
    if (args.parentId) {
      const parent = await ctx.db.get(args.parentId);
      if (!parent) {
        throw new Error("Parent filter not found");
      }

      // 4. Validation: child type must be valid for parent
      const validChildTypes = getValidChildTypes(
        parent.type
      );
      if (!validChildTypes.includes(args.type)) {
        throw new Error(
          `Invalid child type '${args.type}' for parent type '${parent.type}'. ` +
            `Valid types: ${validChildTypes.join(", ")}`
        );
      }
    } else {
      // 5. Validation: only 'qualification' can be root
      if (args.type !== "qualification") {
        throw new Error(
          "Only 'qualification' nodes can be root-level"
        );
      }
    }

    // 6. Check for duplicates (same name + parent)
    const duplicate = await ctx.db
      .query("FilterOption")
      .withIndex("by_parentId", (q) =>
        q.eq("parentId", args.parentId)
      )
      .filter((q) => q.eq(q.field("name"), args.name))
      .first();

    if (duplicate) {
      throw new Error(
        `A filter named '${args.name}' already exists at this level`
      );
    }

    // 7. Create node
    const newId = await ctx.db.insert("FilterOption", {
      name: args.name.trim(),
      type: args.type,
      parentId: args.parentId,
      description: args.description?.trim(),
      requirements: args.requirements?.trim(),
      avgSalary: args.avgSalary?.trim(),
      relevantExams: args.relevantExams?.trim(),
      image: args.image?.trim(),
      likes: 0,
      comments: 0,
      isActive: true,
    });

    return { _id: newId };
  },
});

/**
 * Hierarchy Rules Enforcer
 */
function getValidChildTypes(
  parentType:
    | "qualification"
    | "category"
    | "sector"
    | "subSector"
    | "branch"
    | "role"
): Array<
  | "qualification"
  | "category"
  | "sector"
  | "subSector"
  | "branch"
  | "role"
> {
  const hierarchy = {
    qualification: ["category"],
    category: ["sector"],
    sector: ["subSector"],
    subSector: ["branch"],
    branch: ["role"],
    role: [], // Leaf node - no children allowed
  };

  return hierarchy[parentType];
}
```

**Validation Matrix:**

| Parent Type     | Valid Child Types | Example                                    |
| --------------- | ----------------- | ------------------------------------------ |
| `null` (root)   | `qualification`   | "Graduation", "12th Standard"              |
| `qualification` | `category`        | "Government Jobs", "Private Jobs"          |
| `category`      | `sector`          | "Defence Services", "IT & Software"        |
| `sector`        | `subSector`       | "Indian Navy", "Software Development"      |
| `subSector`     | `branch`          | "Executive Branch", "Frontend Development" |
| `branch`        | `role`            | "Navy Pilot", "React Developer"            |
| `role`          | _none_            | (Leaf node)                                |

---

#### Mutation: `updateFilterNode`

**Purpose:** Edit existing node

```typescript
export const updateFilterNode = mutation({
  args: {
    filterId: v.id("FilterOption"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    requirements: v.optional(v.string()),
    avgSalary: v.optional(v.string()),
    relevantExams: v.optional(v.string()),
    image: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // 1. Security check
    await getAdmin(ctx);

    // 2. Verify node exists
    const node = await ctx.db.get(args.filterId);
    if (!node) {
      throw new Error("Filter node not found");
    }

    // 3. Validation: name cannot be empty
    if (args.name !== undefined && !args.name.trim()) {
      throw new Error("Name cannot be empty");
    }

    // 4. Build update object (only changed fields)
    const updates: any = {};
    if (args.name !== undefined)
      updates.name = args.name.trim();
    if (args.description !== undefined)
      updates.description = args.description.trim();
    if (args.requirements !== undefined)
      updates.requirements = args.requirements.trim();
    if (args.avgSalary !== undefined)
      updates.avgSalary = args.avgSalary.trim();
    if (args.relevantExams !== undefined)
      updates.relevantExams = args.relevantExams.trim();
    if (args.image !== undefined)
      updates.image = args.image.trim();

    // 5. Check for duplicate name (if name changed)
    if (args.name && args.name !== node.name) {
      const duplicate = await ctx.db
        .query("FilterOption")
        .withIndex("by_parentId", (q) =>
          q.eq("parentId", node.parentId)
        )
        .filter((q) =>
          q.and(
            q.eq(q.field("name"), args.name),
            q.neq(q.field("_id"), args.filterId)
          )
        )
        .first();

      if (duplicate) {
        throw new Error(
          `A filter named '${args.name}' already exists at this level`
        );
      }
    }

    // 6. Update node
    await ctx.db.patch(args.filterId, updates);

    return { success: true };
  },
});
```

---

#### Mutation: `toggleFilterActive`

**Purpose:** Soft delete / restore node

```typescript
export const toggleFilterActive = mutation({
  args: {
    filterId: v.id("FilterOption"),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    // 1. Security check
    await getAdmin(ctx);

    // 2. Verify node exists
    const node = await ctx.db.get(args.filterId);
    if (!node) {
      throw new Error("Filter node not found");
    }

    // 3. Toggle active status
    await ctx.db.patch(args.filterId, {
      isActive: args.isActive,
    });

    // 4. Cascade to children (if deactivating)
    if (!args.isActive) {
      const children = await ctx.db
        .query("FilterOption")
        .withIndex("by_parentId", (q) =>
          q.eq("parentId", args.filterId)
        )
        .collect();

      for (const child of children) {
        await ctx.db.patch(child._id, { isActive: false });
        // Recursively deactivate descendants
        await deactivateDescendants(ctx, child._id);
      }
    }

    return { success: true };
  },
});

/**
 * Recursive helper to deactivate all descendants
 */
async function deactivateDescendants(
  ctx: any,
  parentId: string
) {
  const children = await ctx.db
    .query("FilterOption")
    .withIndex("by_parentId", (q) =>
      q.eq("parentId", parentId)
    )
    .collect();

  for (const child of children) {
    await ctx.db.patch(child._id, { isActive: false });
    await deactivateDescendants(ctx, child._id);
  }
}
```

**Cascade Behavior:**

- Deactivating "Government Jobs" → hides all defence, railway, banking paths
- Reactivating parent does NOT auto-activate children (manual control)

---

### File: `convex/adminPosts.ts`

#### Mutation: `createAdminPost`

```typescript
import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAdmin } from "./adminAuth";

export const createAdminPost = mutation({
  args: {
    content: v.string(),
    imageUrl: v.optional(v.string()),
    storageId: v.optional(v.id("_storage")),
    linkedFilterOptionIds: v.array(v.id("FilterOption")),
  },
  handler: async (ctx, args) => {
    // 1. Security check
    const { userId } = await getAdmin(ctx);

    // 2. Validation
    if (!args.content.trim()) {
      throw new Error("Post content cannot be empty");
    }

    // 3. Verify all linked filters exist
    for (const filterId of args.linkedFilterOptionIds) {
      const filter = await ctx.db.get(filterId);
      if (!filter) {
        throw new Error(`Invalid filter ID: ${filterId}`);
      }
    }

    // 4. Create post
    const postId = await ctx.db.insert("communityPosts", {
      userId: userId,
      content: args.content.trim(),
      imageUrl: args.imageUrl,
      storageId: args.storageId,
      linkedFilterOptionIds: args.linkedFilterOptionIds,
      likes: 0,
      comments: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isActive: true,
    });

    return { postId };
  },
});
```

---

## Frontend Components Architecture

### Route Structure

```
app/
├─ admin/
│  ├─ _layout.tsx          # Admin auth guard
│  ├─ index.tsx            # Dashboard home
│  ├─ filters.tsx          # Filter tree manager
│  └─ posts.tsx            # Post manager (future)
```

### Component Hierarchy

```
AdminDashboard (index.tsx)
│
├─ FilterTreeManager (filters.tsx)
│  │
│  ├─ FilterTree (components/admin/FilterTree.tsx)
│  │  └─ FilterTreeNode (components/admin/FilterTreeNode.tsx) [recursive]
│  │
│  ├─ FilterEditor (components/admin/FilterEditor.tsx)
│  │  ├─ Dynamic field renderer
│  │  └─ Save/Cancel actions
│  │
│  └─ AddChildModal (components/admin/AddChildModal.tsx)
│
└─ AdminPostManager (posts.tsx)
   ├─ FilterPicker (components/admin/FilterPicker.tsx)
   └─ PostForm (reuse existing Create screen logic)
```

---

### File: `app/admin/_layout.tsx`

```typescript
import { Stack, Redirect } from "expo-router";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@clerk/clerk-expo";
import { ActivityIndicator, View } from "react-native";

export default function AdminLayout() {
  const { isSignedIn, isLoaded } = useAuth();
  const currentUser = useQuery(
    api.users.getCurrentUser,
    isSignedIn ? {} : "skip"
  );

  // Loading state
  if (!isLoaded || (isSignedIn && currentUser === undefined)) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Redirect if not admin
  if (!currentUser?.isAdmin) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#FF6B6B" },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "bold" },
      }}
    >
      <Stack.Screen
        name="index"
        options={{ title: "Admin Dashboard" }}
      />
      <Stack.Screen
        name="filters"
        options={{ title: "Manage Filters" }}
      />
    </Stack>
  );
}
```

---

### File: `app/admin/index.tsx`

```typescript
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { router } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

export default function AdminDashboard() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin Dashboard</Text>

      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push("/admin/filters")}
      >
        <MaterialIcons name="account-tree" size={48} color="#4CAF50" />
        <Text style={styles.cardTitle}>Manage Filter Hierarchy</Text>
        <Text style={styles.cardDesc}>
          Create, edit, and organize career path filters
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.card, styles.cardDisabled]}
        disabled
      >
        <MaterialIcons name="post-add" size={48} color="#999" />
        <Text style={styles.cardTitle}>Manage Posts</Text>
        <Text style={styles.cardDesc}>Coming soon...</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 24,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 24,
    marginBottom: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardDisabled: {
    opacity: 0.5,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 12,
  },
  cardDesc: {
    fontSize: 14,
    color: "#666",
    marginTop: 8,
    textAlign: "center",
  },
});
```

---

### File: `components/admin/FilterTree.tsx`

```typescript
import { View, ScrollView, StyleSheet, ActivityIndicator } from "react-native";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import FilterTreeNode from "./FilterTreeNode";
import { useState, useMemo } from "react";
import { Id } from "@/convex/_generated/dataModel";

interface FilterNode {
  _id: Id<"FilterOption">;
  name: string;
  type: string;
  parentId?: Id<"FilterOption">;
  description?: string;
  requirements?: string;
  avgSalary?: string;
  relevantExams?: string;
  image?: string;
  isActive: boolean;
  children?: FilterNode[];
}

export default function FilterTree({
  onNodeSelect,
}: {
  onNodeSelect: (node: FilterNode) => void;
}) {
  const allFilters = useQuery(api.adminFilters.getAllFilters);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Build tree structure
  const tree = useMemo(() => {
    if (!allFilters) return [];

    const nodeMap = new Map<string, FilterNode>();
    const rootNodes: FilterNode[] = [];

    // First pass: create node objects
    allFilters.forEach((filter) => {
      nodeMap.set(filter._id, {
        ...filter,
        children: [],
      });
    });

    // Second pass: build parent-child relationships
    allFilters.forEach((filter) => {
      const node = nodeMap.get(filter._id)!;
      if (filter.parentId) {
        const parent = nodeMap.get(filter.parentId);
        if (parent) {
          parent.children!.push(node);
        }
      } else {
        rootNodes.push(node);
      }
    });

    // Sort alphabetically at each level
    const sortNodes = (nodes: FilterNode[]) => {
      nodes.sort((a, b) => a.name.localeCompare(b.name));
      nodes.forEach((node) => {
        if (node.children) sortNodes(node.children);
      });
    };
    sortNodes(rootNodes);

    return rootNodes;
  }, [allFilters]);

  const toggleExpand = (nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  if (!allFilters) {
    return <ActivityIndicator size="large" style={{ marginTop: 50 }} />;
  }

  return (
    <ScrollView style={styles.container}>
      {tree.map((node) => (
        <FilterTreeNode
          key={node._id}
          node={node}
          depth={0}
          isExpanded={expandedNodes.has(node._id)}
          onToggleExpand={() => toggleExpand(node._id)}
          onSelect={() => onNodeSelect(node)}
          expandedNodes={expandedNodes}
          onToggleExpandChild={toggleExpand}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
```

---

### File: `components/admin/FilterTreeNode.tsx`

```typescript
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Id } from "@/convex/_generated/dataModel";

interface FilterNode {
  _id: Id<"FilterOption">;
  name: string;
  type: string;
  isActive: boolean;
  children?: FilterNode[];
}

interface Props {
  node: FilterNode;
  depth: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onSelect: () => void;
  expandedNodes: Set<string>;
  onToggleExpandChild: (nodeId: string) => void;
}

export default function FilterTreeNode({
  node,
  depth,
  isExpanded,
  onToggleExpand,
  onSelect,
  expandedNodes,
  onToggleExpandChild,
}: Props) {
  const hasChildren = node.children && node.children.length > 0;
  const indentWidth = depth * 24;

  return (
    <View>
      {/* Node Row */}
      <View
        style={[
          styles.nodeRow,
          { paddingLeft: indentWidth + 12 },
          !node.isActive && styles.inactiveNode,
        ]}
      >
        {/* Expand/Collapse Icon */}
        <TouchableOpacity
          onPress={onToggleExpand}
          style={styles.expandButton}
          disabled={!hasChildren}
        >
          <MaterialIcons
            name={
              hasChildren
                ? isExpanded
                  ? "expand-more"
                  : "chevron-right"
                : "fiber-manual-record"
            }
            size={20}
            color={hasChildren ? "#333" : "#ccc"}
          />
        </TouchableOpacity>

        {/* Node Name */}
        <TouchableOpacity
          onPress={onSelect}
          style={styles.nodeContent}
        >
          <Text style={[styles.nodeName, !node.isActive && styles.inactiveText]}>
            {node.name}
          </Text>
          <Text style={styles.nodeType}>{node.type}</Text>
        </TouchableOpacity>

        {/* Status Indicator */}
        {!node.isActive && (
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>Hidden</Text>
          </View>
        )}
      </View>

      {/* Children (recursive) */}
      {isExpanded && hasChildren && (
        <View>
          {node.children!.map((child) => (
            <FilterTreeNode
              key={child._id}
              node={child}
              depth={depth + 1}
              isExpanded={expandedNodes.has(child._id)}
              onToggleExpand={() => onToggleExpandChild(child._id)}
              onSelect={onSelect}
              expandedNodes={expandedNodes}
              onToggleExpandChild={onToggleExpandChild}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  nodeRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  inactiveNode: {
    backgroundColor: "#f9f9f9",
  },
  expandButton: {
    padding: 4,
  },
  nodeContent: {
    flex: 1,
    marginLeft: 8,
  },
  nodeName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  inactiveText: {
    color: "#999",
    textDecorationLine: "line-through",
  },
  nodeType: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  statusBadge: {
    backgroundColor: "#ff9800",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: "white",
    fontSize: 10,
    fontWeight: "600",
  },
});
```

---

### File: `components/admin/FilterEditor.tsx`

```typescript
import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from "react-native";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

interface FilterNode {
  _id: Id<"FilterOption">;
  name: string;
  type: string;
  description?: string;
  requirements?: string;
  avgSalary?: string;
  relevantExams?: string;
  image?: string;
  isActive: boolean;
}

interface Props {
  node: FilterNode;
  onClose: () => void;
  onSaveSuccess: () => void;
}

export default function FilterEditor({ node, onClose, onSaveSuccess }: Props) {
  const updateNode = useMutation(api.adminFilters.updateFilterNode);
  const toggleActive = useMutation(api.adminFilters.toggleFilterActive);

  const [formData, setFormData] = useState({
    name: node.name,
    description: node.description || "",
    requirements: node.requirements || "",
    avgSalary: node.avgSalary || "",
    relevantExams: node.relevantExams || "",
    image: node.image || "",
  });

  const [isSaving, setIsSaving] = useState(false);
  const hasChanges = JSON.stringify(formData) !== JSON.stringify({
    name: node.name,
    description: node.description || "",
    requirements: node.requirements || "",
    avgSalary: node.avgSalary || "",
    relevantExams: node.relevantExams || "",
    image: node.image || "",
  });

  // Field configuration based on node type
  const editableFields = getEditableFields(node.type);

  const handleSave = async () => {
    if (!hasChanges) return;

    setIsSaving(true);
    try {
      await updateNode({
        filterId: node._id,
        name: formData.name,
        description: formData.description,
        requirements: formData.requirements,
        avgSalary: formData.avgSalary,
        relevantExams: formData.relevantExams,
        image: formData.image,
      });
      Alert.alert("Success", "Filter updated successfully");
      onSaveSuccess();
      onClose();
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async () => {
    const action = node.isActive ? "hide" : "show";
    Alert.alert(
      `${action.charAt(0).toUpperCase() + action.slice(1)} Filter`,
      `Are you sure you want to ${action} this filter?${
        !node.isActive ? "" : " This will also hide all child filters."
      }`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            try {
              await toggleActive({
                filterId: node._id,
                isActive: !node.isActive,
              });
              onSaveSuccess();
            } catch (error: any) {
              Alert.alert("Error", error.message);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Edit {node.type}</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.closeButton}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.form}>
        {/* Name Field (always editable) */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Name *</Text>
          <TextInput
            style={styles.input}
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            placeholder="Enter name"
          />
        </View>

        {/* Dynamic Fields */}
        {editableFields.description && (
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(text) =>
                setFormData({ ...formData, description: text })
              }
              placeholder="Enter description"
              multiline
              numberOfLines={4}
            />
          </View>
        )}

        {editableFields.requirements && (
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Requirements</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.requirements}
              onChangeText={(text) =>
                setFormData({ ...formData, requirements: text })
              }
              placeholder="Enter requirements"
              multiline
              numberOfLines={3}
            />
          </View>
        )}

        {editableFields.avgSalary && (
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Average Salary</Text>
            <TextInput
              style={styles.input}
              value={formData.avgSalary}
              onChangeText={(text) =>
                setFormData({ ...formData, avgSalary: text })
              }
              placeholder="e.g., ₹3-6 LPA"
            />
          </View>
        )}

        {editableFields.relevantExams && (
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Relevant Exams</Text>
            <TextInput
              style={styles.input}
              value={formData.relevantExams}
              onChangeText={(text) =>
                setFormData({ ...formData, relevantExams: text })
              }
              placeholder="e.g., UPSC, SSC CGL"
            />
          </View>
        )}

        {editableFields.image && (
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Image URL</Text>
            <TextInput
              style={styles.input}
              value={formData.image}
              onChangeText={(text) =>
                setFormData({ ...formData, image: text })
              }
              placeholder="https://..."
            />
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, styles.toggleButton]}
          onPress={handleToggleActive}
        >
          <Text style={styles.buttonText}>
            {node.isActive ? "Hide" : "Show"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            styles.saveButton,
            (!hasChanges || isSaving) && styles.buttonDisabled,
          ]}
          onPress={handleSave}
          disabled={!hasChanges || isSaving}
        >
          <Text style={styles.buttonText}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/**
 * Determine which fields should be editable based on node type
 */
function getEditableFields(type: string) {
  // All types can have description and image
  const base = {
    description: true,
    image: true,
  };

  // More detailed fields for deeper levels
  if (type === "role" || type === "branch") {
    return {
      ...base,
      requirements: true,
      avgSalary: true,
      relevantExams: true,
    };
  }

  if (type === "subSector" || type === "sector") {
    return {
      ...base,
      requirements: true,
      relevantExams: true,
    };
  }

  // Top levels (qualification, category) - basic fields only
  return base;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  closeButton: {
    fontSize: 24,
    color: "#666",
  },
  form: {
    flex: 1,
    padding: 16,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  footer: {
    flexDirection: "row",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  toggleButton: {
    backgroundColor: "#ff9800",
  },
  saveButton: {
    backgroundColor: "#4CAF50",
  },
  buttonDisabled: {
    backgroundColor: "#ccc",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
```

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1)

**Goal:** Security + Basic Backend API

- [ ] **TODO 1:** Create `convex/adminAuth.ts` with `getAdmin()` helper
- [ ] **TODO 2:** Create `convex/adminFilters.ts` with:
  - [ ] `getAllFilters` query
  - [ ] `createFilterNode` mutation + validation
  - [ ] `updateFilterNode` mutation
  - [ ] `toggleFilterActive` mutation
- [ ] **TODO 3:** Write unit tests for hierarchy validation logic
- [ ] **Testing:** Use Convex dashboard to test mutations directly

**Deliverable:** Backend API fully functional and validated

---

### Phase 2: Admin Route (Week 2)

**Goal:** Secure route + basic UI shell

- [ ] **TODO 4:** Create `app/admin/_layout.tsx` with auth guard
- [ ] **TODO 5:** Create `app/admin/index.tsx` dashboard home
- [ ] **TODO 6:** Add navigation helper (e.g., deep link `/admin`)
- [ ] **Testing:** Verify non-admins are redirected

**Deliverable:** Admin route accessible only to admins

---

### Phase 3: Filter Tree View (Week 2-3)

**Goal:** Read-only hierarchy visualization

- [ ] **TODO 7:** Create `components/admin/FilterTree.tsx`
  - [ ] Fetch all filters in one query
  - [ ] Build in-memory tree
  - [ ] Implement expand/collapse
- [ ] **TODO 8:** Create `components/admin/FilterTreeNode.tsx`
  - [ ] Recursive rendering
  - [ ] Depth indentation
  - [ ] Active/inactive styling
- [ ] **TODO 9:** Create `app/admin/filters.tsx` to host tree
- [ ] **Testing:** Load 500+ nodes and verify performance

**Deliverable:** Admin can browse entire hierarchy

---

### Phase 4: Node Editor (Week 3-4)

**Goal:** Edit existing nodes

- [ ] **TODO 10:** Create `components/admin/FilterEditor.tsx`
  - [ ] Dynamic field rendering based on node type
  - [ ] Form validation
  - [ ] Save functionality
- [ ] **TODO 11:** Integrate editor with tree (tap to edit)
- [ ] **TODO 12:** Add confirmation dialogs
- [ ] **Testing:** Edit various node types, verify field restrictions

**Deliverable:** Admin can edit all filter nodes

---

### Phase 5: Add Child Nodes (Week 4)

**Goal:** Create new hierarchy nodes

- [ ] **TODO 13:** Create `components/admin/AddChildModal.tsx`
  - [ ] Auto-determine child type from parent
  - [ ] Minimal form (name + description)
- [ ] **TODO 14:** Add "Add Child" button to tree nodes
- [ ] **TODO 15:** Test hierarchy rules enforcement
- [ ] **Testing:** Attempt to create invalid hierarchies (should fail)

**Deliverable:** Admin can expand hierarchy dynamically

---

### Phase 6: Visibility Toggle (Week 4)

**Goal:** Soft delete functionality

- [ ] **TODO 16:** Add toggle button to editor
- [ ] **TODO 17:** Implement cascade logic (hide children)
- [ ] **TODO 18:** Add visual indicators for hidden nodes
- [ ] **Testing:** Hide parent, verify children hidden from user app

**Deliverable:** Admin can control content visibility

---

### Phase 7: Admin Post Linking (Week 5)

**Goal:** Enhanced post creation flow

- [ ] **TODO 19:** Create `components/admin/FilterPicker.tsx`
  - [ ] Reuse tree in "selection mode"
  - [ ] Multi-select capability
- [ ] **TODO 20:** Update create post screen for admins
- [ ] **TODO 21:** Save `linkedFilterOptionIds` correctly
- [ ] **Testing:** Create post, link to multiple filters, verify on user feed

**Deliverable:** Admin posts correctly linked to filters

---

### Phase 8: Polish & Launch (Week 5-6)

**Goal:** Production-ready

- [ ] **TODO 22:** Add loading states to all mutations
- [ ] **TODO 23:** Add error handling + user-friendly messages
- [ ] **TODO 24:** Prevent circular references (parent cannot be descendant)
- [ ] **TODO 25:** Add search/filter in tree view
- [ ] **TODO 26:** Performance testing with 1000+ nodes
- [ ] **TODO 27:** Remove console.logs
- [ ] **TODO 28:** Documentation update
- [ ] **TODO 29:** Admin user guide
- [ ] **TODO 30:** Deploy to production

**Deliverable:** Feature shipped to production

---

## Performance Optimization

### Query Optimization

**Problem:** Loading 1000+ filter nodes
**Solution:** Single query + client-side tree building

```typescript
// ❌ BAD: N+1 queries
const rootNodes = await getFilterChildren({
  parentId: undefined,
});
for (const node of rootNodes) {
  const children = await getFilterChildren({
    parentId: node._id,
  }); // N queries
}

// ✅ GOOD: One query
const allFilters = await getAllFilters(); // 1 query
const tree = buildTree(allFilters); // O(n) in-memory operation
```

### Rendering Optimization

**Problem:** Large tree re-renders
**Solution:** Memoization + virtualization

```typescript
// Memoize tree building
const tree = useMemo(
  () => buildTree(allFilters),
  [allFilters]
);

// Virtualization (if >100 root nodes)
import { FlashList } from "@shopify/flash-list";
// Use FlashList instead of ScrollView for large lists
```

### Mutation Optimization

**Problem:** Cascade operations slow
**Solution:** Batch updates

```typescript
// ❌ BAD: Sequential patches
for (const child of children) {
  await ctx.db.patch(child._id, { isActive: false }); // N mutations
}

// ✅ GOOD: Collect IDs, batch process
const updates = children.map((child) =>
  ctx.db.patch(child._id, { isActive: false })
);
await Promise.all(updates); // Parallel execution
```

---

## Security Checklist

### Pre-Launch Security Audit

- [ ] **Authentication**

  - [ ] All admin mutations call `getAdmin(ctx)`
  - [ ] No admin mutations callable by regular users
  - [ ] Admin route redirects non-admins
  - [ ] No client-side admin flags (only UI, not security)

- [ ] **Authorization**

  - [ ] Admin status stored in Convex (not Clerk metadata)
  - [ ] Cannot elevate own privileges
  - [ ] Audit log for admin actions (future)

- [ ] **Input Validation**

  - [ ] Name field cannot be empty
  - [ ] No XSS in text fields (sanitize HTML)
  - [ ] Image URLs validated (basic URL format check)
  - [ ] No SQL injection risk (Convex handles this)

- [ ] **Data Integrity**

  - [ ] Cannot create circular references
  - [ ] Cannot delete root nodes accidentally
  - [ ] Soft deletes only
  - [ ] Hierarchy rules enforced on backend

- [ ] **Error Handling**
  - [ ] No sensitive data in error messages
  - [ ] Generic errors for auth failures
  - [ ] Detailed errors only for admins

---

## Testing Strategy

### Unit Tests (Backend)

```typescript
// convex/adminFilters.test.ts (pseudo-code)

describe("createFilterNode", () => {
  it("should reject non-admin users", async () => {
    const ctx = createMockContext({ isAdmin: false });
    await expect(
      createFilterNode(ctx, {
        name: "Test",
        type: "qualification",
      })
    ).rejects.toThrow("Forbidden");
  });

  it("should reject invalid parent-child combinations", async () => {
    const parentId = await createNode({ type: "role" }); // Leaf node
    await expect(
      createFilterNode(ctx, {
        name: "Invalid Child",
        type: "qualification",
        parentId,
      })
    ).rejects.toThrow("Invalid child type");
  });

  it("should prevent duplicate names at same level", async () => {
    const parentId = await createNode({
      type: "qualification",
    });
    await createNode({
      name: "Defence",
      type: "category",
      parentId,
    });
    await expect(
      createFilterNode(ctx, {
        name: "Defence",
        type: "category",
        parentId,
      })
    ).rejects.toThrow("already exists");
  });
});
```

### Integration Tests

1. **End-to-End Flow:**

   - Admin logs in
   - Navigates to `/admin`
   - Creates new "qualification" node
   - Adds "category" child
   - Edits description
   - Toggles inactive
   - Verifies hidden from user app

2. **Performance Test:**
   - Seed 1000 filter nodes
   - Measure `getAllFilters` query time (target: <500ms)
   - Measure tree render time (target: <1s)

### Manual Testing Checklist

- [ ] Non-admin cannot access `/admin` route
- [ ] Admin can view full tree
- [ ] Expand/collapse works
- [ ] Edit form shows correct fields per node type
- [ ] Cannot save empty name
- [ ] Cannot create invalid child types
- [ ] Toggle active/inactive works
- [ ] Cascading deactivation works
- [ ] Duplicate name validation works
- [ ] User app does not show inactive filters
- [ ] Admin posts link to filters correctly

---

## Rollback Plan

### If Critical Bug Found Post-Launch

1. **Immediate Action:**

   - Disable admin route (comment out route in `_layout.tsx`)
   - No data loss (all changes are in database)

2. **Revert Mechanism:**

   ```typescript
   // Create migration to restore from backup
   export const restoreFromBackup = mutation({
     handler: async (ctx) => {
       // Load backup FilterOptions
       // Replace current data
     },
   });
   ```

3. **Fallback:**
   - Admin uses existing seed scripts
   - Manual database edits via Convex dashboard

### Data Safety Measures

- [ ] **Daily backups** of FilterOption table
- [ ] **Soft deletes only** (no data loss)
- [ ] **Audit trail** of changes (future enhancement)
- [ ] **Staging environment** testing before production

---

## Future Enhancements

### Phase 2 Features (Post-MVP)

1. **Bulk Operations**

   - Import filters from CSV
   - Export current hierarchy
   - Bulk activate/deactivate

2. **Advanced Search**

   - Search filters by name
   - Filter by type
   - Filter by active status

3. **Analytics Dashboard**

   - Most liked career paths
   - Engagement per filter node
   - User search patterns

4. **Version History**

   - Track all changes to filters
   - Revert to previous versions
   - Compare versions

5. **Multi-Admin Support**

   - Role-based permissions (editor vs reviewer)
   - Approval workflow for changes
   - Activity log per admin

6. **Content Scheduling**

   - Schedule filter activation
   - Seasonal content (exam dates)

7. **AI Assistance**
   - Auto-generate descriptions
   - Suggest related exams
   - Salary data auto-fill from APIs

---

## Appendix

### Hierarchy Validation Reference

```typescript
const HIERARCHY_RULES = {
  qualification: {
    allowedChildren: ["category"],
    canBeRoot: true,
    requiredFields: ["name", "description"],
    optionalFields: [
      "image",
      "requirements",
      "relevantExams",
    ],
  },
  category: {
    allowedChildren: ["sector"],
    canBeRoot: false,
    requiredFields: ["name"],
    optionalFields: ["description", "image"],
  },
  sector: {
    allowedChildren: ["subSector"],
    canBeRoot: false,
    requiredFields: ["name"],
    optionalFields: [
      "description",
      "image",
      "requirements",
      "relevantExams",
    ],
  },
  subSector: {
    allowedChildren: ["branch"],
    canBeRoot: false,
    requiredFields: ["name"],
    optionalFields: [
      "description",
      "requirements",
      "relevantExams",
      "avgSalary",
    ],
  },
  branch: {
    allowedChildren: ["role"],
    canBeRoot: false,
    requiredFields: ["name"],
    optionalFields: [
      "description",
      "requirements",
      "relevantExams",
      "avgSalary",
    ],
  },
  role: {
    allowedChildren: [],
    canBeRoot: false,
    requiredFields: ["name", "description"],
    optionalFields: [
      "requirements",
      "avgSalary",
      "relevantExams",
      "image",
    ],
  },
};
```

### Error Messages Reference

| Error Code | Message                             | User Action                |
| ---------- | ----------------------------------- | -------------------------- |
| `AUTH_001` | "Unauthenticated: Please log in"    | Log in                     |
| `AUTH_002` | "Forbidden: Admin access required"  | Contact admin              |
| `HIER_001` | "Invalid child type for parent"     | Choose correct type        |
| `HIER_002` | "Cannot create root node of type X" | Create qualification first |
| `HIER_003` | "Parent filter not found"           | Refresh and try again      |
| `VAL_001`  | "Name cannot be empty"              | Enter valid name           |
| `VAL_002`  | "Duplicate name at this level"      | Choose unique name         |
| `DATA_001` | "Filter node not found"             | Refresh page               |

---

## Decision Log

### Key Design Decisions

| Decision                  | Rationale                  | Alternatives Considered        |
| ------------------------- | -------------------------- | ------------------------------ |
| **Single query for tree** | Performance (1 vs N calls) | Lazy loading per node          |
| **Soft deletes only**     | Data safety, reversibility | Hard deletes with confirmation |
| **Backend validation**    | Security, data integrity   | Frontend-only validation       |
| **No schema changes**     | Zero risk, backward compat | Add audit fields               |
| **Admin route hidden**    | Clean UX, no clutter       | Tab bar item for admins        |
| **Type auto-determined**  | Prevents errors, better UX | Admin selects child type       |
| **Cascade deactivation**  | Logical consistency        | Manual child deactivation      |

---

## Glossary

- **Filter Node:** Single entry in FilterOption table
- **Hierarchy Level:** One of 6 types (qualification → role)
- **Soft Delete:** Setting `isActive: false` instead of removing record
- **Cascade:** Operation that affects children recursively
- **Admin Guard:** Security layer checking `isAdmin` flag
- **Tree Building:** Converting flat array into nested structure

---

## Contact & Support

- **Tech Lead:** [Your Name]
- **Backend:** Convex Documentation
- **Frontend:** Expo/React Native Docs
- **Design:** [Design Team]

---

**Document Version:** 1.0  
**Last Updated:** January 11, 2026  
**Next Review:** After Phase 1 completion

---

## Quick Start for Developers

```bash
# 1. Checkout feature branch
git checkout -b feature/admin-dashboard

# 2. Install dependencies (if needed)
npm install

# 3. Start development
npm start

# 4. Create admin user (via Convex dashboard)
# Set user.isAdmin = true for your test account

# 5. Navigate to /admin in app
# Should see admin dashboard

# 6. Start with TODO 1 (adminAuth.ts)
```

---

**END OF DOCUMENT**
