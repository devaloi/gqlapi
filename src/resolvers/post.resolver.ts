import type { Resolvers } from "../generated/graphql.js";
import pubsub from "../services/pubsub.js";
import {
  AuthenticationError,
  ForbiddenError,
  NotFoundError,
} from "../utils/errors.js";

export const POST_CREATED = "POST_CREATED";
export const POST_UPDATED = "POST_UPDATED";

export const postResolvers: Resolvers = {
  Query: {
    posts: async (_parent, args, context) => {
      const first = args.first ?? 10;
      const where = args.published != null ? { published: args.published } : {};
      const cursor = args.after
        ? { id: Buffer.from(args.after, "base64").toString("utf-8") }
        : undefined;

      const [nodes, totalCount] = await Promise.all([
        context.prisma.post.findMany({
          where,
          take: first,
          skip: cursor ? 1 : 0,
          cursor,
          orderBy: { createdAt: "desc" },
        }),
        context.prisma.post.count({ where }),
      ]);

      const edges = nodes.map((node) => ({
        cursor: Buffer.from(node.id).toString("base64"),
        node,
      }));

      return {
        edges,
        pageInfo: {
          hasNextPage: nodes.length === first,
          hasPreviousPage: !!args.after,
          startCursor: edges.length > 0 ? edges[0].cursor : null,
          endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : null,
        },
        totalCount,
      };
    },
  },
  Mutation: {
    createPost: async (_parent, args, context) => {
      if (!context.user) throw new AuthenticationError();
      const post = await context.prisma.post.create({
        data: {
          title: args.title,
          content: args.content,
          authorId: context.user.id,
        },
      });
      pubsub.publish(POST_CREATED, { postCreated: post });
      return post;
    },
    updatePost: async (_parent, args, context) => {
      if (!context.user) throw new AuthenticationError();
      const existing = await context.prisma.post.findUnique({
        where: { id: args.id },
      });
      if (!existing) throw new NotFoundError("Post not found");
      if (existing.authorId !== context.user.id) throw new ForbiddenError();

      const data: Record<string, unknown> = {};
      if (args.title != null) data.title = args.title;
      if (args.content != null) data.content = args.content;
      if (args.published != null) data.published = args.published;

      const post = await context.prisma.post.update({
        where: { id: args.id },
        data,
      });
      pubsub.publish(POST_UPDATED, { postUpdated: post });
      return post;
    },
    deletePost: async (_parent, args, context) => {
      if (!context.user) throw new AuthenticationError();
      const existing = await context.prisma.post.findUnique({
        where: { id: args.id },
      });
      if (!existing) throw new NotFoundError("Post not found");
      if (existing.authorId !== context.user.id) throw new ForbiddenError();
      return context.prisma.post.delete({ where: { id: args.id } });
    },
  },
};
