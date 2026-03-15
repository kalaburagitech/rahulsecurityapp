import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/* ------------------------------------------------ */
/* GET ORGANIZATION BY ID */
/* ------------------------------------------------ */

export const get = query({
    args: { id: v.id("organizations") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    },
});

/* ------------------------------------------------ */
/* CREATE ORGANIZATION */
/* ------------------------------------------------ */

export const create = mutation({
    args: {
        name: v.string(),
    },

    handler: async (ctx, args) => {
        const orgId = await ctx.db.insert("organizations", {
            name: args.name,
            createdAt: Date.now(),
        });

        return orgId;
    },
});

/* ------------------------------------------------ */
/* UPDATE ORGANIZATION */
/* ------------------------------------------------ */

export const update = mutation({
    args: {
        id: v.id("organizations"),
        name: v.string(),
    },

    handler: async (ctx, args) => {
        await ctx.db.patch(args.id, {
            name: args.name,
        });

        return args.id;
    },
});

/* ------------------------------------------------ */
/* DELETE ORGANIZATION */
/* ------------------------------------------------ */

export const remove = mutation({
    args: { id: v.id("organizations") },

    handler: async (ctx, args) => {
        /* Check if organization has sites */

        const site = await ctx.db
            .query("sites")
            .withIndex("by_org", (q) => q.eq("organizationId", args.id))
            .first();

        if (site) {
            throw new Error(
                "Cannot delete organization with active sites. Delete sites first."
            );
        }

        /* Check if organization has users */

        const user = await ctx.db
            .query("users")
            .withIndex("by_org", (q) => q.eq("organizationId", args.id))
            .first();

        if (user) {
            throw new Error(
                "Cannot delete organization with registered users."
            );
        }

        await ctx.db.delete(args.id);

        return true;
    },
});

/* ------------------------------------------------ */
/* LIST ALL ORGANIZATIONS */
/* ------------------------------------------------ */

export const list = query({
    handler: async (ctx) => {
        return await ctx.db.query("organizations").collect();
    },
});

/* ------------------------------------------------ */
/* COUNT USERS IN ORGANIZATION */
/* ------------------------------------------------ */

export const countUsers = query({
    args: { organizationId: v.id("organizations") },

    handler: async (ctx, args) => {
        const users = await ctx.db
            .query("users")
            .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
            .collect();

        return users.length;
    },
});

/* ------------------------------------------------ */
/* COUNT SITES IN ORGANIZATION */
/* ------------------------------------------------ */

export const countSites = query({
    args: { organizationId: v.id("organizations") },

    handler: async (ctx, args) => {
        const sites = await ctx.db
            .query("sites")
            .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
            .collect();

        return sites.length;
    },
});