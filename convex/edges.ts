import { query, mutation } from './_generated/server';
import { v } from 'convex/values';

/**
 * Create a new edge (connection between tasks)
 */
export const create = mutation({
  args: {
    projectId: v.id('projects'),
    source: v.id('tasks'),
    target: v.id('tasks'),
    type: v.string(),
    sourceHandle: v.optional(v.string()),
    targetHandle: v.optional(v.string()),
    label: v.optional(v.string()),
    animated: v.optional(v.boolean()),
  },
  returns: v.id('edges'),
  handler: async (ctx, args) => {
    return await ctx.db.insert('edges', {
      projectId: args.projectId,
      source: args.source,
      target: args.target,
      type: args.type,
      sourceHandle: args.sourceHandle,
      targetHandle: args.targetHandle,
      label: args.label,
      animated: args.animated,
    });
  },
});

/**
 * Get all edges for a project (returns React Flow edges format)
 */
export const listForProject = query({
  args: {
    projectId: v.id('projects'),
  },
  returns: v.array(
    v.object({
      id: v.string(), // React Flow expects 'id' not '_id'
      source: v.string(), // React Flow expects string ID
      target: v.string(), // React Flow expects string ID
      type: v.optional(v.string()),
      sourceHandle: v.optional(v.string()),
      targetHandle: v.optional(v.string()),
      label: v.optional(v.string()),
      style: v.optional(
        v.object({
          stroke: v.optional(v.string()),
          strokeWidth: v.optional(v.number()),
        })
      ),
      animated: v.optional(v.boolean()),
    })
  ),
  handler: async (ctx, args) => {
    const edges = await ctx.db
      .query('edges')
      .withIndex('by_project', (q) => q.eq('projectId', args.projectId))
      .collect();

    // Transform to React Flow edge format
    return edges.map((edge) => ({
      id: edge._id,
      source: edge.source,
      target: edge.target,
      type: edge.type,
      sourceHandle: edge.sourceHandle,
      targetHandle: edge.targetHandle,
      label: edge.label,
      style: edge.style,
      animated: edge.animated,
    }));
  },
});

/**
 * Update edge style
 */
export const updateStyle = mutation({
  args: {
    edgeId: v.id('edges'),
    style: v.object({
      stroke: v.optional(v.string()),
      strokeWidth: v.optional(v.number()),
    }),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.edgeId, {
      style: args.style,
    });
    return null;
  },
});

/**
 * Update edge label
 */
export const updateLabel = mutation({
  args: {
    edgeId: v.id('edges'),
    label: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.edgeId, {
      label: args.label,
    });
    return null;
  },
});

/**
 * Toggle edge animation
 */
export const toggleAnimation = mutation({
  args: {
    edgeId: v.id('edges'),
    animated: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.edgeId, {
      animated: args.animated,
    });
    return null;
  },
});

/**
 * Delete an edge
 */
export const remove = mutation({
  args: {
    edgeId: v.id('edges'),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.edgeId);
    return null;
  },
});

/**
 * Delete all edges between two tasks
 */
export const removeAllBetweenTasks = mutation({
  args: {
    source: v.id('tasks'),
    target: v.id('tasks'),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const edges = await ctx.db
      .query('edges')
      .withIndex('by_source', (q) => q.eq('source', args.source))
      .collect();

    const edgesToDelete = edges.filter((edge) => edge.target === args.target);

    for (const edge of edgesToDelete) {
      await ctx.db.delete(edge._id);
    }
    return null;
  },
});
