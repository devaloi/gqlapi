import type { Resolvers } from "../generated/graphql.js";
import { userResolvers } from "./user.resolver.js";
import { DateTimeScalar } from "./scalars.js";

const resolvers: Resolvers = {
  DateTime: DateTimeScalar,
  Query: {
    ...userResolvers.Query,
  },
  Mutation: {
    ...userResolvers.Mutation,
  },
};

export default resolvers;
