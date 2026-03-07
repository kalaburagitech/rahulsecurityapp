import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const get = query({
    args: { id: v.id("organizations") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    },
});

export const create = mutation({
    args: { name: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db.insert("organizations", {
            name: args.name,
            createdAt: Date.now(),
        });
    },
});

export const list = query({
    handler: async (ctx) => {
        return await ctx.db.query("organizations").collect();
    },
});
