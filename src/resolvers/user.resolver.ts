import type { Resolvers } from "../generated/graphql.js";
import {
  signToken,
  hashPassword,
  comparePassword,
} from "../services/auth.service.js";
import { AuthenticationError } from "../utils/errors.js";

export const userResolvers: Resolvers = {
  Query: {
    me: async (_parent, _args, context) => {
      if (!context.user) return null;
      return context.prisma.user.findUnique({
        where: { id: context.user.id },
      });
    },
    user: async (_parent, args, context) => {
      return context.prisma.user.findUnique({ where: { id: args.id } });
    },
  },
  Mutation: {
    signup: async (_parent, args, context) => {
      const hashed = await hashPassword(args.password);
      const user = await context.prisma.user.create({
        data: {
          email: args.email,
          password: hashed,
          name: args.name,
        },
      });
      const token = signToken(user.id);
      return { token, user };
    },
    login: async (_parent, args, context) => {
      const user = await context.prisma.user.findUnique({
        where: { email: args.email },
      });
      if (!user) throw new AuthenticationError("Invalid credentials");
      const valid = await comparePassword(args.password, user.password);
      if (!valid) throw new AuthenticationError("Invalid credentials");
      const token = signToken(user.id);
      return { token, user };
    },
  },
};
