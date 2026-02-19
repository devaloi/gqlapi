# Build gqlapi — GraphQL API with Apollo Server 5

You are building a **portfolio project** for a Senior AI Engineer's public GitHub. It must be impressive, clean, and production-grade. Read these docs before writing any code:

1. **`E02-graphql-api.md`** — Complete project spec: architecture, GraphQL schema, Apollo plugins, Prisma models, DataLoader setup, pagination pattern, subscription wiring, phased build plan, commit plan. This is your primary blueprint. Follow it phase by phase.
2. **`github-portfolio.md`** — Portfolio goals and Definition of Done (Level 1 + Level 2). Understand the quality bar.
3. **`github-portfolio-checklist.md`** — Pre-publish checklist. Every item must pass before you're done.

---

## Instructions

### Read first, build second
Read all three docs completely before writing a single line of code. Understand the schema-first approach (.graphql files as source of truth), the codegen pipeline (schema → TypeScript types → type-safe resolvers), the DataLoader per-request pattern, the Relay cursor-based pagination, and the WebSocket subscription setup.

### Follow the phases in order
The project spec has 4 phases. Do them in order:
1. **Foundation + Schema** — project setup, Prisma schema with User + Post models and migrations, GraphQL schema files (.graphql), codegen config to generate TypeScript types and resolver signatures
2. **Auth + Core Resolvers** — auth service (JWT + bcrypt), Apollo auth plugin extracting Bearer token, user resolvers (signup, login, me), post resolvers (full CRUD with ownership)
3. **DataLoader + Pagination + Subscriptions** — per-request DataLoader for N+1 prevention, cursor-based pagination with Relay-style connections, WebSocket subscriptions for postCreated/postUpdated
4. **Testing + Logging + Polish** — test setup with Apollo test client, integration tests for auth/users/posts/subscriptions, logging plugin, custom error types, README

### Commit frequently
Follow the commit plan in the spec. Use **conventional commits**. Each commit should be a logical unit.

### Quality non-negotiables
- **Schema-first design.** The `.graphql` files are the source of truth. Resolvers implement the schema, not the other way around. Do not use code-first (e.g., type-graphql or nexus).
- **GraphQL Code Generator.** Run `@graphql-codegen/cli` to generate TypeScript types from the schema. Resolver functions must use the generated `Resolvers` type for compile-time type safety. If the schema changes, regenerate types.
- **Apollo Server 5.4.** Use Apollo Server 5 standalone (not Express middleware). Auth and logging are implemented as Apollo Server plugins — not Express middleware, not custom directives.
- **Prisma 7 with migrations.** Use Prisma for all database access. Schema changes go through `prisma migrate`. No raw SQL queries. Prisma Client is the only database interface.
- **DataLoader per request.** Create fresh DataLoader instances per request (in the context factory). Never reuse DataLoaders across requests — they cache by design and would leak data between users.
- **Cursor-based pagination.** Implement Relay-style connections: `edges` with `cursor` + `node`, `pageInfo` with `hasNextPage`/`hasPreviousPage`/`startCursor`/`endCursor`, `totalCount`. Cursors are opaque base64-encoded IDs.
- **WebSocket subscriptions.** Use `graphql-ws` protocol (not the legacy `subscriptions-transport-ws`). HTTP server handles queries/mutations. WebSocket server handles subscriptions.
- **Integration tests with Apollo test client.** Tests execute GraphQL operations against the real server stack (resolvers + DataLoaders + Prisma), not mocked resolvers. Use a test database.
- **Lint clean.** `eslint` and `prettier` must pass. TypeScript strict mode enabled.

### What NOT to do
- Don't use code-first schema generation (type-graphql, nexus, pothos). This is schema-first with `.graphql` files.
- Don't use Express or any HTTP framework. Apollo Server 5 standalone handles HTTP directly.
- Don't reuse DataLoaders across requests. Each request gets fresh instances to prevent data leaking.
- Don't use the legacy `subscriptions-transport-ws`. Use `graphql-ws` — it's the maintained protocol.
- Don't leave `// TODO` or `// FIXME` comments anywhere.
- Don't hardcode JWT secrets or database URLs. Use environment variables with `.env.example` as reference.

---

## GitHub Username

The GitHub username is **devaloi**. The npm package scope is not needed — this is not published to npm. Repository URL: `github.com/devaloi/gqlapi`.

## Start

Read the three docs. Then begin Phase 1 from `E02-graphql-api.md`.
