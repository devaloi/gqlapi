# E02: gqlapi — GraphQL API with Apollo Server 5

**Catalog ID:** E02 | **Size:** M | **Language:** TypeScript
**Repo name:** `gqlapi`
**One-liner:** A GraphQL API with Apollo Server 5, schema-first design, type-safe resolvers via codegen, Prisma 7 + PostgreSQL, JWT auth, DataLoader, cursor-based pagination, subscriptions, and comprehensive integration tests.

---

## Why This Stands Out

- **Apollo Server 5.4** — latest version, standalone HTTP server, Apollo plugin system for auth and logging
- **Schema-first approach** — `.graphql` schema files as source of truth, not code-first — clean separation of schema and implementation
- **GraphQL Code Generator** — generates TypeScript types and resolver signatures from schema, guaranteeing type-safe resolvers at compile time
- **Prisma 7 with migrations** — type-safe database layer with schema-driven migrations, not raw SQL
- **DataLoader for N+1 prevention** — per-request batching and caching, the correct solution to GraphQL's N+1 problem
- **Cursor-based pagination** — Relay-style connections (edges, nodes, pageInfo) — the production-standard pagination pattern
- **Subscriptions via WebSocket** — real-time updates using `graphql-ws` protocol over WebSocket transport
- **JWT auth as Apollo plugin** — authentication middleware implemented as a proper Apollo Server plugin, not ad-hoc middleware

---

## Architecture

```
gqlapi/
├── src/
│   ├── index.ts                 # Server bootstrap: Apollo Server, WebSocket, middleware
│   ├── schema/
│   │   ├── typeDefs.ts          # Load and merge .graphql files
│   │   ├── user.graphql         # User type, queries, mutations
│   │   ├── post.graphql         # Post type, queries, mutations, subscriptions
│   │   └── common.graphql       # Shared types: PageInfo, Connection, Edge, DateTime scalar
│   ├── generated/
│   │   └── graphql.ts           # Codegen output: TypeScript types + resolver signatures
│   ├── resolvers/
│   │   ├── index.ts             # Merge all resolvers
│   │   ├── user.resolver.ts     # User queries + mutations
│   │   ├── post.resolver.ts     # Post queries + mutations + subscriptions
│   │   ├── scalars.ts           # Custom scalar resolvers (DateTime)
│   │   └── types.ts             # Context type, auth payload type
│   ├── plugins/
│   │   ├── auth.plugin.ts       # Apollo plugin: extract JWT from headers, set context.user
│   │   └── logging.plugin.ts    # Apollo plugin: log query/mutation name, duration, errors
│   ├── dataloaders/
│   │   ├── index.ts             # Create per-request DataLoader instances
│   │   ├── user.loader.ts       # Batch load users by ID
│   │   └── post.loader.ts       # Batch load posts by author ID
│   ├── services/
│   │   ├── auth.service.ts      # JWT sign, verify, hash password (bcrypt)
│   │   └── pubsub.ts            # PubSub instance for subscriptions
│   ├── prisma/
│   │   └── client.ts            # Prisma client singleton
│   └── utils/
│       ├── pagination.ts        # Cursor encode/decode, connection builder
│       └── errors.ts            # Custom GraphQL errors (AuthenticationError, NotFoundError)
├── prisma/
│   ├── schema.prisma            # Database schema: User, Post models
│   └── migrations/              # Prisma migrations
├── tests/
│   ├── setup.ts                 # Test database setup, Apollo test client factory
│   ├── user.test.ts             # User CRUD integration tests
│   ├── post.test.ts             # Post CRUD + pagination integration tests
│   ├── auth.test.ts             # Auth flow: signup, login, protected queries
│   └── subscription.test.ts     # Subscription integration tests
├── codegen.ts                   # GraphQL Code Generator configuration
├── package.json
├── tsconfig.json
├── .env.example
├── .gitignore
├── .eslintrc.cjs
├── .prettierrc
├── LICENSE
└── README.md
```

---

## GraphQL Schema (Key Types)

```graphql
type User {
  id: ID!
  email: String!
  name: String!
  posts(first: Int, after: String): PostConnection!
  createdAt: DateTime!
}

type Post {
  id: ID!
  title: String!
  content: String!
  published: Boolean!
  author: User!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type PostConnection {
  edges: [PostEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type PostEdge {
  cursor: String!
  node: Post!
}

type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}

type Query {
  me: User
  user(id: ID!): User
  posts(first: Int, after: String, published: Boolean): PostConnection!
}

type Mutation {
  signup(email: String!, password: String!, name: String!): AuthPayload!
  login(email: String!, password: String!): AuthPayload!
  createPost(title: String!, content: String!): Post!
  updatePost(id: ID!, title: String, content: String, published: Boolean): Post!
  deletePost(id: ID!): Post!
}

type Subscription {
  postCreated: Post!
  postUpdated(authorId: ID): Post!
}

type AuthPayload {
  token: String!
  user: User!
}

scalar DateTime
```

---

## Tech Stack

| Component | Choice |
|-----------|--------|
| Runtime | Node 24 LTS |
| Language | TypeScript 5.7 |
| GraphQL Server | Apollo Server 5.4 (standalone) |
| Schema | Schema-first (.graphql files) |
| Codegen | @graphql-codegen/cli + typescript + typescript-resolvers |
| Database | PostgreSQL 17 via Prisma 7 |
| Auth | JWT (jsonwebtoken) + bcrypt |
| DataLoader | dataloader (Facebook) |
| Subscriptions | graphql-ws + ws |
| PubSub | In-memory (graphql-subscriptions) |
| Testing | Vitest + Apollo test client |
| Linting | ESLint + Prettier |

---

## Phased Build Plan

### Phase 1: Foundation + Schema

**1.1 — Project setup**
- `npm init`, install dependencies: `@apollo/server`, `graphql`, `@prisma/client`, `prisma`, `graphql-tag`, `typescript`, `vitest`
- `tsconfig.json`, `.eslintrc.cjs`, `.prettierrc`, `.gitignore`

**1.2 — Prisma schema + migrations**
- `prisma/schema.prisma` with User and Post models
- User: id (UUID), email (unique), password (hashed), name, createdAt
- Post: id (UUID), title, content, published (default false), authorId (FK), createdAt, updatedAt
- Generate first migration, generate Prisma client

**1.3 — GraphQL schema files**
- `common.graphql`: PageInfo, Connection pattern types, DateTime scalar
- `user.graphql`: User type, Query.me, Query.user, Mutation.signup, Mutation.login, AuthPayload
- `post.graphql`: Post type, PostConnection, PostEdge, Query.posts, Mutation.createPost/updatePost/deletePost, Subscription.postCreated/postUpdated
- `typeDefs.ts`: load and merge all .graphql files

**1.4 — Code generation**
- Install `@graphql-codegen/cli`, `@graphql-codegen/typescript`, `@graphql-codegen/typescript-resolvers`
- `codegen.ts` config: read .graphql files, output to `src/generated/graphql.ts`
- Generate types, verify resolver signatures match schema

### Phase 2: Auth + Core Resolvers

**2.1 — Auth service**
- `signToken(userId)` — JWT sign with configurable secret and expiry
- `verifyToken(token)` — JWT verify, return payload
- `hashPassword(password)` — bcrypt hash
- `comparePassword(password, hash)` — bcrypt compare

**2.2 — Auth plugin**
- Apollo Server plugin: `requestDidStart` → extract `Authorization: Bearer <token>` from request headers
- Verify JWT, attach user to context
- Unauthenticated requests get `context.user = null` (not rejected — individual resolvers decide)

**2.3 — User resolvers**
- `signup`: hash password, create user via Prisma, return token + user
- `login`: find user by email, compare password, return token + user
- `me`: return current user from context (auth required)
- `user(id)`: find user by ID (public)

**2.4 — Post resolvers (CRUD)**
- `createPost`: auth required, create post with authorId from context
- `updatePost`: auth required, verify ownership, update fields
- `deletePost`: auth required, verify ownership, delete
- `posts`: public query with optional published filter

### Phase 3: DataLoader + Pagination + Subscriptions

**3.1 — DataLoader**
- Per-request DataLoader creation (new loaders per request in context)
- `userLoader`: batch load users by ID array → `prisma.user.findMany({ where: { id: { in: ids } } })`
- `postsByAuthorLoader`: batch load posts by author ID
- Wire into resolvers: `Post.author` uses `userLoader`, `User.posts` uses `postsByAuthorLoader`

**3.2 — Cursor-based pagination**
- `pagination.ts`: encode cursor (base64 of ID), decode cursor
- Connection builder: accept Prisma query args, return edges, nodes, pageInfo with hasNextPage/hasPreviousPage
- `Query.posts(first, after)`: paginated posts query
- `User.posts(first, after)`: paginated posts per user
- Tests: first page, next page via cursor, empty results, totalCount

**3.3 — Subscriptions**
- In-memory PubSub instance
- WebSocket server via `graphql-ws` + `ws`
- `postCreated` subscription: publish on `createPost` mutation
- `postUpdated(authorId)` subscription: publish on `updatePost`, optional filter by author
- Server setup: HTTP for queries/mutations, WebSocket upgrade for subscriptions

### Phase 4: Testing + Logging + Polish

**4.1 — Test setup**
- Test database (SQLite or test PostgreSQL via env)
- `setup.ts`: create Apollo test client with context mocking, seed helpers, database reset between tests

**4.2 — Integration tests**
- `auth.test.ts`: signup → login → me (token flow), invalid credentials, duplicate email
- `user.test.ts`: create user, query by ID, query me with/without auth
- `post.test.ts`: CRUD operations, ownership enforcement, pagination cursors
- `subscription.test.ts`: subscribe → create post → receive event

**4.3 — Logging plugin**
- Apollo plugin: log operation name, type (query/mutation/subscription), duration, errors
- Structured JSON logging

**4.4 — Error handling**
- Custom errors: `AuthenticationError` (UNAUTHENTICATED), `NotFoundError` (NOT_FOUND), `ForbiddenError` (FORBIDDEN)
- Consistent error format in responses

**4.5 — README**
- Badges, install, quick start
- Schema overview with types
- Auth flow documentation
- Pagination usage examples
- Subscription setup
- Running tests
- Environment variables reference

---

## Commit Plan

1. `chore: scaffold project with TypeScript and config`
2. `feat: add Prisma schema with User and Post models`
3. `feat: add GraphQL schema files and type definitions`
4. `feat: add GraphQL Code Generator config and generated types`
5. `feat: add auth service with JWT and bcrypt`
6. `feat: add auth plugin for Apollo Server`
7. `feat: add user resolvers (signup, login, me, user)`
8. `feat: add post resolvers (CRUD operations)`
9. `feat: add DataLoader for N+1 prevention`
10. `feat: add cursor-based pagination with Relay connections`
11. `feat: add subscriptions via WebSocket`
12. `feat: add logging plugin`
13. `feat: add custom error types`
14. `test: add integration tests for auth, users, posts, subscriptions`
15. `docs: add README with schema overview and usage examples`
