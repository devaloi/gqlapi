import type { PrismaClient } from "@prisma/client";
import { createUserLoader } from "./user.loader.js";
import { createPostsByAuthorLoader } from "./post.loader.js";
import type { DataLoaders } from "../resolvers/types.js";

export function createLoaders(prisma: PrismaClient): DataLoaders {
  return {
    userLoader: createUserLoader(prisma),
    postsByAuthorLoader: createPostsByAuthorLoader(prisma),
  };
}
