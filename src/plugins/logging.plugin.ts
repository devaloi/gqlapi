import type { ApolloServerPlugin } from "@apollo/server";
import type { GraphQLContext } from "../resolvers/types.js";

export const loggingPlugin: ApolloServerPlugin<GraphQLContext> = {
  async requestDidStart() {
    const start = Date.now();
    return {
      async didResolveOperation(requestContext) {
        const operationName =
          requestContext.request.operationName ?? "anonymous";
        const operation = requestContext.operation?.operation ?? "unknown";
        console.log(
          JSON.stringify({
            level: "info",
            event: "operation_started",
            operation,
            operationName,
            timestamp: new Date().toISOString(),
          }),
        );
      },
      async willSendResponse(requestContext) {
        const duration = Date.now() - start;
        const operationName =
          requestContext.request.operationName ?? "anonymous";
        const errors = requestContext.errors;
        console.log(
          JSON.stringify({
            level: errors ? "error" : "info",
            event: "operation_completed",
            operationName,
            duration_ms: duration,
            errors: errors?.map((e) => e.message),
            timestamp: new Date().toISOString(),
          }),
        );
      },
    };
  },
};
