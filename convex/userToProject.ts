import { query, mutation } from './_generated/server';
import { v } from 'convex/values';

/**
 * Assign a user to a project with a role
 */
export const assign = mutation({
  args: {
    userId: v.string(),
    projectId: v.id('projects'),
    role: v.union(v.literal('coach'), v.literal('default')),
  },
  returns: v.id('userToProject'),
  handler: async (ctx, args) => {
    // Check if assignment already exists
    const existing = await ctx.db
      .query('userToProject')
      .withIndex('by_userId_and_projectId', (q) =>
        q.eq('userId', args.userId).eq('projectId', args.projectId)
      )
      .unique();

    if (existing) {
      throw new Error('User is already assigned to this project');
    }

    return await ctx.db.insert('userToProject', {
      userId: args.userId,
      projectId: args.projectId,
      role: args.role,
    });
  },
});

/**
 * Get all users assigned to a project
 */
export const listUsersForProject = query({
  args: {
    projectId: v.id('projects'),
  },
  returns: v.array(
    v.object({
      _id: v.id('userToProject'),
      userId: v.string(),
      projectId: v.id('projects'),
      role: v.union(v.literal('coach'), v.literal('default')),
    })
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query('userToProject')
      .withIndex('by_projectId', (q) => q.eq('projectId', args.projectId))
      .collect();
  },
});

/**
 * Get all coaches for a project
 */
export const listCoachesForProject = query({
  args: {
    projectId: v.id('projects'),
  },
  returns: v.array(
    v.object({
      _id: v.id('userToProject'),
      userId: v.string(),
      projectId: v.id('projects'),
      role: v.union(v.literal('coach'), v.literal('default')),
    })
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query('userToProject')
      .withIndex('by_projectId_and_role', (q) =>
        q.eq('projectId', args.projectId).eq('role', 'coach')
      )
      .collect();
  },
});

/**
 * Update user's role in a project
 */
export const updateRole = mutation({
  args: {
    userId: v.string(),
    projectId: v.id('projects'),
    role: v.union(v.literal('coach'), v.literal('default')),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const assignment = await ctx.db
      .query('userToProject')
      .withIndex('by_userId_and_projectId', (q) =>
        q.eq('userId', args.userId).eq('projectId', args.projectId)
      )
      .unique();

    if (!assignment) {
      throw new Error('User is not assigned to this project');
    }

    await ctx.db.patch(assignment._id, {
      role: args.role,
    });
    return null;
  },
});

/**
 * Remove a user from a project
 */
export const remove = mutation({
  args: {
    userId: v.string(),
    projectId: v.id('projects'),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const assignment = await ctx.db
      .query('userToProject')
      .withIndex('by_userId_and_projectId', (q) =>
        q.eq('userId', args.userId).eq('projectId', args.projectId)
      )
      .unique();

    if (!assignment) {
      throw new Error('User is not assigned to this project');
    }

    await ctx.db.delete(assignment._id);
    return null;
  },
});

/**
 * Check if a user has access to a project
 */
export const hasAccess = query({
  args: {
    userId: v.string(),
    projectId: v.id('projects'),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const assignment = await ctx.db
      .query('userToProject')
      .withIndex('by_userId_and_projectId', (q) =>
        q.eq('userId', args.userId).eq('projectId', args.projectId)
      )
      .unique();

    return assignment !== null;
  },
});

/**
 * Check if a user is a coach for a project
 */
export const isCoach = query({
  args: {
    userId: v.string(),
    projectId: v.id('projects'),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const assignment = await ctx.db
      .query('userToProject')
      .withIndex('by_userId_and_projectId', (q) =>
        q.eq('userId', args.userId).eq('projectId', args.projectId)
      )
      .unique();

    return assignment !== null && assignment.role === 'coach';
  },
});

