import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createPoint = mutation({
    args: {
        siteId: v.id("sites"),
        name: v.string(),
        latitude: v.number(),
        longitude: v.number(),
        organizationId: v.id("organizations"),
    },
    handler: async (ctx, args) => {
        // Revert to generated unique QR code string for storage
        const qrCode = `${args.siteId.slice(0, 4)}-${args.name.replace(/\s+/g, '-').toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

        return await ctx.db.insert("patrolPoints", {
            siteId: args.siteId,
            name: args.name,
            qrCode,
            latitude: args.latitude,
            longitude: args.longitude,
            organizationId: args.organizationId,
        });
    },
});

export const listByOrg = query({
    args: { organizationId: v.id("organizations") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("patrolPoints")
            .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
            .collect();
    },
});

export const listBySite = query({
    args: { siteId: v.id("sites") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("patrolPoints")
            .withIndex("by_site", (q) => q.eq("siteId", args.siteId))
            .collect();
    },
});

export const updatePoint = mutation({
    args: {
        id: v.id("patrolPoints"),
        name: v.string(),
        latitude: v.number(),
        longitude: v.number(),
    },
    handler: async (ctx, args) => {
        const { id, ...data } = args;
        return await ctx.db.patch(id, data);
    },
});

export const removePoint = mutation({
    args: { id: v.id("patrolPoints") },
    handler: async (ctx, args) => {
        return await ctx.db.delete(args.id);
    },
});
