import type { ApolloServerPlugin } from "@apollo/server";
import type { GraphQLContext } from "../resolvers/types.js";

function log(data: Record<string, unknown>): void {
  if (process.env.NODE_ENV !== "test") {
    console.log(JSON.stringify({ ...data, timestamp: new Date().toISOString() }));
  }
}

export const loggingPlugin: ApolloServerPlugin<GraphQLContext> = {
  async requestDidStart() {
    const start = Date.now();
    return {
      async didResolveOperation(requestContext) {
        const operationName =
          requestContext.request.operationName ?? "anonymous";
        const operation = requestContext.operation?.operation ?? "unknown";
        log({
          level: "info",
          event: "operation_started",
          operation,
          operationName,
        });
      },
      async willSendResponse(requestContext) {
        const duration = Date.now() - start;
        const operationName =
          requestContext.request.operationName ?? "anonymous";
        const errors = requestContext.errors;
        log({
          level: errors ? "error" : "info",
          event: "operation_completed",
          operationName,
          duration_ms: duration,
          errors: errors?.map((e) => e.message),
        });
      },
    };
  },
};
