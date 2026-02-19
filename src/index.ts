import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import express from "express";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/lib/use/ws";
import { makeExecutableSchema } from "@graphql-tools/schema";
import cors from "cors";
import typeDefs from "./schema/typeDefs.js";
import resolvers from "./resolvers/index.js";
import prisma from "./prisma/client.js";
import { createLoaders } from "./dataloaders/index.js";
import { getUserFromToken } from "./plugins/auth.plugin.js";
import { loggingPlugin } from "./plugins/logging.plugin.js";
import type { GraphQLContext } from "./resolvers/types.js";

export const schema = makeExecutableSchema({ typeDefs, resolvers });

const app: express.Express = express();
const httpServer = createServer(app);

const wsServer = new WebSocketServer({
  server: httpServer,
  path: "/graphql",
});

const serverCleanup = useServer(
  {
    schema,
    context: async (ctx): Promise<GraphQLContext> => {
      const token =
        (ctx.connectionParams?.authorization as string) ??
        (ctx.connectionParams?.Authorization as string);
      const user = getUserFromToken(token);
      return { prisma, user, loaders: createLoaders(prisma) };
    },
  },
  wsServer as unknown as Parameters<typeof useServer>[1],
);

const server = new ApolloServer<GraphQLContext>({
  schema,
  plugins: [
    ApolloServerPluginDrainHttpServer({ httpServer }),
    {
      async serverWillStart() {
        return {
          async drainServer() {
            await serverCleanup.dispose();
          },
        };
      },
    },
    loggingPlugin,
  ],
});

await server.start();

app.use(
  "/graphql",
  cors<cors.CorsRequest>(),
  express.json(),
  expressMiddleware(server, {
    context: async ({ req }): Promise<GraphQLContext> => {
      const user = getUserFromToken(req.headers.authorization);
      return { prisma, user, loaders: createLoaders(prisma) };
    },
  }) as unknown as express.RequestHandler,
);

const PORT = parseInt(process.env.PORT ?? "4000", 10);

httpServer.listen(PORT, () => {
  console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`);
  console.log(`🔌 Subscriptions ready at ws://localhost:${PORT}/graphql`);
});

export { server, httpServer, app };
