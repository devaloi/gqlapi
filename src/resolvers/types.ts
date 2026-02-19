import type { PrismaClient, User } from "@prisma/client";
import type DataLoader from "dataloader";

export interface AuthUser {
  id: string;
  email: string;
}

export interface DataLoaders {
  userLoader: DataLoader<string, User | null>;
  postsByAuthorLoader: DataLoader<string, Array<import("@prisma/client").Post>>;
}

export interface GraphQLContext {
  prisma: PrismaClient;
  user: AuthUser | null;
  loaders: DataLoaders;
}
