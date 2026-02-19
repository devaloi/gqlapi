import { GraphQLScalarType, Kind } from "graphql";

export const DateTimeScalar = new GraphQLScalarType({
  name: "DateTime",
  description: "DateTime custom scalar type",
  serialize(value: unknown): string {
    if (value instanceof Date) return value.toISOString();
    throw new Error("DateTime serializer expected a Date object");
  },
  parseValue(value: unknown): Date {
    if (typeof value === "string") return new Date(value);
    throw new Error("DateTime parser expected a string");
  },
  parseLiteral(ast): Date {
    if (ast.kind === Kind.STRING) return new Date(ast.value);
    throw new Error("DateTime parser expected a string literal");
  },
});
