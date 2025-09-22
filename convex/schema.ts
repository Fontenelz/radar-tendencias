import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  trends: defineTable({
    title: v.string(),
    description: v.string(),
    category: v.string(),
    keywords: v.array(v.string()),
    relevanceScore: v.number(),
    searchVolume: v.number(),
    createdAt: v.number(),
    source: v.string(),
  }).index("by_category", ["category"])
    .index("by_relevance", ["relevanceScore"])
    .index("by_created_at", ["createdAt"]),

  savedTrends: defineTable({
    userId: v.id("users"),
    trendId: v.id("trends"),
    savedAt: v.number(),
    notes: v.optional(v.string()),
  }).index("by_user", ["userId"])
    .index("by_trend", ["trendId"]),

  categories: defineTable({
    name: v.string(),
    slug: v.string(),
    description: v.string(),
    color: v.string(),
    icon: v.string(),
  }).index("by_slug", ["slug"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
