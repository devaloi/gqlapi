import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema: "src/schema/*.graphql",
  generates: {
    "src/generated/graphql.ts": {
      plugins: ["typescript", "typescript-resolvers"],
      config: {
        useIndexSignature: true,
        contextType: "../resolvers/types.js#GraphQLContext",
        scalars: {
          DateTime: "Date",
        },
        mappers: {
          User: "@prisma/client#User as UserModel",
          Post: "@prisma/client#Post as PostModel",
        },
      },
    },
  },
};

export default config;
