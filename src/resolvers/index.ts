import type { Resolvers } from "../generated/graphql.js";
import { userResolvers } from "./user.resolver.js";
import { postResolvers } from "./post.resolver.js";
import { DateTimeScalar } from "./scalars.js";
import {
  encodeCursor,
  decodeCursor,
  type ConnectionArgs,
} from "../utils/pagination.js";

const resolvers: Resolvers = {
  DateTime: DateTimeScalar,
  Query: {
    ...userResolvers.Query,
    ...postResolvers.Query,
  },
  Mutation: {
    ...userResolvers.Mutation,
    ...postResolvers.Mutation,
  },
  User: {
    posts: async (parent, args, context) => {
      const first = args.first ?? 10;
      const connArgs: ConnectionArgs = { first, after: args.after };
      const cursor = args.after
        ? { id: decodeCursor(args.after) }
        : undefined;

      const [nodes, totalCount] = await Promise.all([
        context.prisma.post.findMany({
          where: { authorId: parent.id },
          take: first,
          skip: cursor ? 1 : 0,
          cursor,
          orderBy: { createdAt: "desc" },
        }),
        context.prisma.post.count({ where: { authorId: parent.id } }),
      ]);

      const edges = nodes.map((node) => ({
        cursor: encodeCursor(node.id),
        node,
      }));

      return {
        edges,
        pageInfo: {
          hasNextPage: nodes.length === first,
          hasPreviousPage: !!connArgs.after,
          startCursor: edges.length > 0 ? edges[0].cursor : null,
          endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : null,
        },
        totalCount,
      };
    },
  },
  Post: {
    author: async (parent, _args, context) => {
      const user = await context.loaders.userLoader.load(parent.authorId);
      return user!;
    },
  },
};

export default resolvers;
