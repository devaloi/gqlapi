import { PrismaClient } from "@prisma/client";
import { ApolloServer } from "@apollo/server";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createLoaders } from "../src/dataloaders/index.js";
import { getUserFromToken } from "../src/plugins/auth.plugin.js";
import { signToken } from "../src/services/auth.service.js";
import type { GraphQLContext } from "../src/resolvers/types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const schemaDir = join(__dirname, "..", "src", "schema");

function loadSchema(filename: string): string {
  return readFileSync(join(schemaDir, filename), "utf-8");
}

const typeDefs = [
  loadSchema("common.graphql"),
  loadSchema("post.graphql"),
  loadSchema("user.graphql"),
];

export const testPrisma = new PrismaClient({
  datasources: { db: { url: "file:./test.db" } },
});

export async function resetDatabase(): Promise<void> {
  await testPrisma.post.deleteMany();
  await testPrisma.user.deleteMany();
}

let resolversModule: typeof import("../src/resolvers/index.js") | null = null;

export async function createTestServer(token?: string) {
  if (!resolversModule) {
    resolversModule = await import("../src/resolvers/index.js");
  }
  const resolvers = resolversModule.default;
  const schema = makeExecutableSchema({ typeDefs, resolvers });

  const server = new ApolloServer<GraphQLContext>({ schema });
  await server.start();

  const user = token ? getUserFromToken(`Bearer ${token}`) : null;

  return {
    server,
    async execute(options: {
      query: string;
      variables?: Record<string, unknown>;
    }) {
      const response = await server.executeOperation(
        {
          query: options.query,
          variables: options.variables,
        },
        {
          contextValue: {
            prisma: testPrisma,
            user,
            loaders: createLoaders(testPrisma),
          },
        },
      );
      return response;
    },
    async stop() {
      await server.stop();
    },
  };
}

export async function createTestUser(
  email = "test@example.com",
  name = "Test User",
  password = "password123",
) {
  const { hashPassword } = await import("../src/services/auth.service.js");
  const hashed = await hashPassword(password);
  const user = await testPrisma.user.create({
    data: { email, password: hashed, name },
  });
  const token = signToken(user.id);
  return { user, token };
}

export { signToken };
