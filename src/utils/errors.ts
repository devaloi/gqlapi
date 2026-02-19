import { GraphQLError } from "graphql";

export class AuthenticationError extends GraphQLError {
  constructor(message = "Not authenticated") {
    super(message, { extensions: { code: "UNAUTHENTICATED" } });
  }
}

export class ForbiddenError extends GraphQLError {
  constructor(message = "Forbidden") {
    super(message, { extensions: { code: "FORBIDDEN" } });
  }
}

export class NotFoundError extends GraphQLError {
  constructor(message = "Not found") {
    super(message, { extensions: { code: "NOT_FOUND" } });
  }
}

export class ValidationError extends GraphQLError {
  constructor(message = "Validation failed") {
    super(message, { extensions: { code: "BAD_USER_INPUT" } });
  }
}
