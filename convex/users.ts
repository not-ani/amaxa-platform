import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

/**
 * Sync/upsert current user's information
 * This should be called when a user authenticates
 */
export const syncCurrentUser = mutation({
  args: {
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    email: v.optional(v.string()),
    profilePictureUrl: v.optional(v.string()),
  },
  returns: v.id('users'),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.tokenIdentifier) {
      throw new Error('User not authenticated');
    }

    const existing = await ctx.db
      .query('users')
      .withIndex('by_tokenIdentifier', (q) => q.eq('tokenIdentifier', identity.tokenIdentifier))
      .unique();

    if (existing) {
      // Update existing user
      await ctx.db.patch(existing._id, {
        firstName: args.firstName,
        lastName: args.lastName,
        email: args.email,
        profilePictureUrl: args.profilePictureUrl,
      });
      return existing._id;
    } else {
      // Create new user
      return await ctx.db.insert('users', {
        tokenIdentifier: identity.tokenIdentifier,
        firstName: args.firstName,
        lastName: args.lastName,
        email: args.email,
        profilePictureUrl: args.profilePictureUrl,
      });
    }
  },
});

/**
 * Get user by tokenIdentifier
 */
export const getByTokenIdentifier = query({
  args: {
    tokenIdentifier: v.string(),
  },
  returns: v.union(
    v.object({
      _id: v.id('users'),
      tokenIdentifier: v.string(),
      firstName: v.optional(v.string()),
      lastName: v.optional(v.string()),
      email: v.optional(v.string()),
      profilePictureUrl: v.optional(v.string()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query('users')
      .withIndex('by_tokenIdentifier', (q) => q.eq('tokenIdentifier', args.tokenIdentifier))
      .unique();
  },
});

/**
 * List all users
 */
export const list = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id('users'),
      tokenIdentifier: v.string(),
      firstName: v.optional(v.string()),
      lastName: v.optional(v.string()),
      email: v.optional(v.string()),
      profilePictureUrl: v.optional(v.string()),
    })
  ),
  handler: async (ctx) => {
    return await ctx.db.query('users').collect();
  },
});

/**
 * Get multiple users by their tokenIdentifiers
 */
export const getByTokenIdentifiers = query({
  args: {
    tokenIdentifiers: v.array(v.string()),
  },
  returns: v.array(
    v.object({
      _id: v.id('users'),
      tokenIdentifier: v.string(),
      firstName: v.optional(v.string()),
      lastName: v.optional(v.string()),
      email: v.optional(v.string()),
      profilePictureUrl: v.optional(v.string()),
    })
  ),
  handler: async (ctx, args) => {
    const users = [];
    for (const tokenIdentifier of args.tokenIdentifiers) {
      const user = await ctx.db
        .query('users')
        .withIndex('by_tokenIdentifier', (q) => q.eq('tokenIdentifier', tokenIdentifier))
        .unique();
      if (user) {
        users.push(user);
      }
    }
    return users;
  },
});

