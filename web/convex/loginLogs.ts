import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const logLogin = mutation({
  args: {
    userId: v.id("users"),
    email: v.string(),
    organizationId: v.optional(v.id("organizations")),
    ipAddress: v.optional(v.string()),
    browserInfo: v.optional(v.string()),
    sessionId: v.optional(v.string()),
    loginStatus: v.union(v.literal("success"), v.literal("failed"), v.literal("logout")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("loginLogs", {
      userId: args.userId,
      email: args.email,
      organizationId: args.organizationId,
      loginTime: Date.now(),
      ipAddress: args.ipAddress,
      browserInfo: args.browserInfo,
      sessionId: args.sessionId,
      loginStatus: args.loginStatus,
    });
  },
});

export const logLogout = mutation({
  args: {
    logId: v.id("loginLogs"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.logId, {
      logoutTime: Date.now(),
    });
  },
});
