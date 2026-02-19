# gqlapi

A GraphQL API with Apollo Server, schema-first design, type-safe resolvers via codegen, Prisma + SQLite, JWT auth, DataLoader, cursor-based pagination, and subscriptions.

![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)
![Apollo Server](https://img.shields.io/badge/Apollo%20Server-4-blueviolet)
![Prisma](https://img.shields.io/badge/Prisma-6-teal)
![License](https://img.shields.io/badge/License-MIT-green)

## Tech Stack

| Component | Choice |
|-----------|--------|
| Runtime | Node.js 22 |
| Language | TypeScript 5.7 (strict) |
| GraphQL Server | Apollo Server 4 (Express + WebSocket) |
| Schema | Schema-first (.graphql files) |
| Codegen | @graphql-codegen/cli |
| Database | SQLite via Prisma 6 |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| DataLoader | dataloader (per-request batching) |
| Subscriptions | graphql-ws + ws |
| Testing | Vitest |
| Linting | ESLint 9 + Prettier |

## Prerequisites

- Node.js >= 22
- npm >= 10

## Installation

```bash
git clone https://github.com/devaloi/gqlapi.git
cd gqlapi
npm install
cp .env.example .env
npx prisma migrate dev
```

## Usage

### Start the server

```bash
npm run dev
```

The server starts at:
- **HTTP** (queries/mutations): `http://localhost:4000/graphql`
- **WebSocket** (subscriptions): `ws://localhost:4000/graphql`

### Example queries

**Sign up:**

```graphql
mutation {
  signup(email: "user@example.com", password: "secret", name: "Alice") {
    token
    user { id email name }
  }
}
```

**Login:**

```graphql
mutation {
  login(email: "user@example.com", password: "secret") {
    token
    user { id email }
  }
}
```

**Get current user** (requires `Authorization: Bearer <token>` header):

```graphql
query {
  me { id email name createdAt }
}
```

**Create a post** (authenticated):

```graphql
mutation {
  createPost(title: "Hello World", content: "My first post") {
    id title content published
    author { name }
  }
}
```

**Query posts with pagination:**

```graphql
query {
  posts(first: 10, published: true) {
    edges {
      cursor
      node { id title author { name } }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
    totalCount
  }
}
```

**Next page:**

```graphql
query {
  posts(first: 10, after: "Y3Vyc29yXzEw") {
    edges { node { title } }
    pageInfo { hasNextPage endCursor }
  }
}
```

**Subscribe to new posts** (via WebSocket):

```graphql
subscription {
  postCreated {
    id title
    author { name }
  }
}
```

## Schema Overview

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
```

## Auth Flow

1. **Sign up** or **login** to receive a JWT token
2. Include the token in subsequent requests: `Authorization: Bearer <token>`
3. Protected mutations (`createPost`, `updatePost`, `deletePost`) require authentication
4. `me` query returns the current user or `null` if unauthenticated
5. Ownership is enforced — users can only modify/delete their own posts

## Architecture Highlights

- **Schema-first**: `.graphql` files are the source of truth; codegen generates TypeScript types
- **DataLoader**: Per-request batching prevents N+1 queries on `Post.author` and `User.posts`
- **Cursor pagination**: Relay-style connections with opaque base64 cursors
- **Apollo plugins**: Auth extraction and structured JSON logging implemented as server plugins
- **Custom errors**: `AuthenticationError`, `ForbiddenError`, `NotFoundError` with proper GraphQL error codes

## Running Tests

```bash
npm test
```

Tests use a separate SQLite database (`test.db`) and reset between test runs.

```bash
# Type checking
npm run typecheck

# Linting
npm run lint
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | Prisma database connection | `file:./dev.db` |
| `JWT_SECRET` | Secret for JWT signing | (required) |
| `JWT_EXPIRES_IN` | Token expiration | `7d` |
| `PORT` | Server port | `4000` |

## Project Structure

```
src/
├── index.ts              # Server bootstrap (HTTP + WebSocket)
├── schema/               # GraphQL schema files (.graphql)
├── generated/            # Codegen output (TypeScript types)
├── resolvers/            # Query, Mutation, Subscription resolvers
├── plugins/              # Apollo Server plugins (auth, logging)
├── dataloaders/          # DataLoader factories (per-request)
├── services/             # Auth service, PubSub
├── prisma/               # Prisma client singleton
└── utils/                # Pagination helpers, custom errors
tests/
├── auth.test.ts          # Auth flow integration tests
├── user.test.ts          # User query tests
├── post.test.ts          # Post CRUD + pagination tests
└── subscription.test.ts  # PubSub subscription tests
```

## License

MIT
