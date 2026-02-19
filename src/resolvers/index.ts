import type { Resolvers } from "../generated/graphql.js";
import { userResolvers } from "./user.resolver.js";
import { postResolvers } from "./post.resolver.js";
import { DateTimeScalar } from "./scalars.js";

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
};

export default resolvers;
