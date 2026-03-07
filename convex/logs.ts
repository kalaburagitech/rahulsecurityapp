import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

export const createPatrolLog = mutation({
    args: {
        userId: v.id("users"),
        siteId: v.id("sites"),
        patrolPointId: v.id("patrolPoints"),
        imageId: v.optional(v.string()),
        comment: v.string(),
        latitude: v.number(),
        longitude: v.number(),
        distance: v.number(),
        organizationId: v.id("organizations"),
        issueDetails: v.optional(v.object({
            title: v.string(),
            priority: v.union(v.literal("Low"), v.literal("Medium"), v.literal("High")),
        })),
    },
    handler: async (ctx, args) => {
        const { issueDetails, ...logData } = args;
        const logId = await ctx.db.insert("patrolLogs", {
            ...logData,
            createdAt: Date.now(),
        });

        // Auto-create issue if geo-fence violation (> 50m)
        if (args.distance > 50) {
            await ctx.db.insert("issues", {
                siteId: args.siteId,
                logId: logId,
                title: "Geo-fence Violation",
                description: `Patrol logged ${args.distance.toFixed(1)}m away from point.`,
                priority: "High",
                status: "open",
                timestamp: Date.now(),
                organizationId: args.organizationId,
            });
        }

        // Manual Issue reporting
        if (issueDetails) {
            await ctx.db.insert("issues", {
                siteId: args.siteId,
                logId: logId,
                title: issueDetails.title,
                description: args.comment || "Reported during patrol.",
                priority: issueDetails.priority,
                status: "open",
                timestamp: Date.now(),
                organizationId: args.organizationId,
            });
        }

        return logId;
    },
});

export const listPatrolLogs = query({
    args: { organizationId: v.id("organizations"), siteId: v.optional(v.id("sites")) },
    handler: async (ctx, args) => {
        let logs;
        if (args.siteId) {
            logs = await ctx.db
                .query("patrolLogs")
                .withIndex("by_site", (q) => q.eq("siteId", args.siteId as Id<"sites">))
                .order("desc")
                .collect();
        } else {
            logs = await ctx.db
                .query("patrolLogs")
                .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
                .order("desc")
                .collect();
        }

        return await Promise.all(
            logs.map(async (log) => {
                const user = await ctx.db.get(log.userId);
                const site = await ctx.db.get(log.siteId);
                const point = await ctx.db.get(log.patrolPointId);
                return {
                    ...log,
                    userName: user?.name || "Unknown",
                    userRole: user?.role || "SG",
                    siteName: site?.name || "Unknown",
                    pointName: site ? `${site.name}_${point?.name || "Unknown"}` : (point?.name || "Unknown"),
                };
            })
        );
    },
});

export const createVisitLog = mutation({
    args: {
        userId: v.id("users"),
        siteId: v.id("sites"),
        qrData: v.string(),
        remark: v.string(),
        latitude: v.number(),
        longitude: v.number(),
        organizationId: v.id("organizations"),
        imageId: v.optional(v.string()),
        issueDetails: v.optional(v.object({
            title: v.string(),
            priority: v.union(v.literal("Low"), v.literal("Medium"), v.literal("High")),
        })),
    },
    handler: async (ctx, args) => {
        const { issueDetails, ...logData } = args;
        const logId = await ctx.db.insert("visitLogs", {
            ...logData,
            createdAt: Date.now(),
        });

        // Manual Issue reporting for visits
        if (issueDetails) {
            await ctx.db.insert("issues", {
                siteId: args.siteId,
                logId: logId as any,
                title: issueDetails.title,
                description: args.remark || "Reported during visit.",
                priority: issueDetails.priority,
                status: "open",
                timestamp: Date.now(),
                organizationId: args.organizationId,
            });
        }

        return logId;
    },
});

export const listVisitLogs = query({
    args: { organizationId: v.id("organizations") },
    handler: async (ctx, args) => {
        const logs = await ctx.db
            .query("visitLogs")
            .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
            .order("desc")
            .collect();

        return await Promise.all(
            logs.map(async (log) => {
                const user = await ctx.db.get(log.userId);
                const site = await ctx.db.get(log.siteId);

                // Lookup the point by qrCode to get the name
                const point = await ctx.db
                    .query("patrolPoints")
                    .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
                    .filter((q) => q.eq(q.field("qrCode"), log.qrData))
                    .first();

                return {
                    ...log,
                    userName: user?.name || "Unknown",
                    userRole: user?.role || "Officer",
                    siteName: site?.name || "Unknown",
                    pointName: site ? `${site.name}_${point?.name || "General Scan"}` : (point?.name || "General Scan"),
                };
            })
        );
    },
});

export const listIssuesByOrg = query({
    args: { organizationId: v.id("organizations") },
    handler: async (ctx, args) => {
        const issues = await ctx.db
            .query("issues")
            .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
            .order("desc")
            .collect();

        const enrichedIssues = await Promise.all(
            issues.map(async (issue) => {
                const site = await ctx.db.get(issue.siteId);
                let reporterName = "Unknown";
                let reporterRole = "Staff";
                let locationContext = "General Visit";

                // Find the log to get the user
                const patrolLog = await ctx.db.get(issue.logId as Id<"patrolLogs">);
                if (patrolLog) {
                    const user = await ctx.db.get(patrolLog.userId);
                    reporterName = user?.name || "Unknown";
                    reporterRole = user?.role || "SG";

                    const point = await ctx.db.get(patrolLog.patrolPointId);
                    locationContext = point?.name || "Patrol Point";
                } else {
                    const visitLog = await ctx.db.get(issue.logId as Id<"visitLogs">);
                    if (visitLog) {
                        const user = await ctx.db.get(visitLog.userId);
                        reporterName = user?.name || "Unknown";
                        reporterRole = user?.role || "Officer";
                        locationContext = "Visit Scan";
                    }
                }

                return {
                    ...issue,
                    siteName: site?.name || "Unknown Site",
                    reporterName,
                    reporterRole,
                    locationContext,
                };
            })
        );

        return enrichedIssues;
    },
});

export const resolveIssue = mutation({
    args: { issueId: v.id("issues") },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.issueId, { status: "closed" });
    },
});
