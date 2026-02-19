import type { ApolloServerPlugin } from "@apollo/server";
import { verifyToken } from "../services/auth.service.js";
import type { GraphQLContext } from "../resolvers/types.js";

export function extractToken(authHeader: string | undefined): string | null {
  if (!authHeader) return null;
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") return null;
  return parts[1];
}

export const authPlugin: ApolloServerPlugin<GraphQLContext> = {
  async requestDidStart() {
    return {};
  },
};

export function getUserFromToken(
  authHeader: string | undefined,
): GraphQLContext["user"] {
  const token = extractToken(authHeader);
  if (!token) return null;
  try {
    return verifyToken(token);
  } catch {
    return null;
  }
}
