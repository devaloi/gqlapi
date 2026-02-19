import { describe, it, expect, beforeEach, afterAll } from "vitest";
import {
  createTestServer,
  resetDatabase,
  testPrisma,
  createTestUser,
} from "./setup.js";

/* eslint-disable @typescript-eslint/no-explicit-any */

describe("Post", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await testPrisma.$disconnect();
  });

  it("should create a post when authenticated", async () => {
    const { token } = await createTestUser();
    const { execute, stop } = await createTestServer(token);
    const result = await execute({
      query: `
        mutation {
          createPost(title: "Test Post", content: "Content here") {
            id title content published
            author { id name }
          }
        }
      `,
    });
    await stop();

    if (result.body.kind === "single") {
      expect(result.body.singleResult.errors).toBeUndefined();
      const post = (result.body.singleResult.data as any)?.createPost;
      expect(post.title).toBe("Test Post");
      expect(post.published).toBe(false);
      expect(post.author.name).toBe("Test User");
    }
  });

  it("should reject post creation without auth", async () => {
    const { execute, stop } = await createTestServer();
    const result = await execute({
      query: `
        mutation {
          createPost(title: "No Auth", content: "Should fail") {
            id
          }
        }
      `,
    });
    await stop();

    if (result.body.kind === "single") {
      expect(result.body.singleResult.errors).toBeDefined();
      expect(result.body.singleResult.errors![0].extensions?.code).toBe(
        "UNAUTHENTICATED",
      );
    }
  });

  it("should update own post", async () => {
    const { token, user } = await createTestUser();
    const post = await testPrisma.post.create({
      data: {
        title: "Original",
        content: "Original content",
        authorId: user.id,
      },
    });
    const { execute, stop } = await createTestServer(token);
    const result = await execute({
      query: `
        mutation UpdatePost($id: ID!) {
          updatePost(id: $id, title: "Updated", published: true) {
            id title published
          }
        }
      `,
      variables: { id: post.id },
    });
    await stop();

    if (result.body.kind === "single") {
      expect(result.body.singleResult.errors).toBeUndefined();
      const data = result.body.singleResult.data as any;
      expect(data?.updatePost.title).toBe("Updated");
      expect(data?.updatePost.published).toBe(true);
    }
  });

  it("should prevent updating another user's post", async () => {
    const { user: author } = await createTestUser(
      "author@example.com",
      "Author",
    );
    const post = await testPrisma.post.create({
      data: {
        title: "Author Post",
        content: "Content",
        authorId: author.id,
      },
    });
    const { token: otherToken } = await createTestUser(
      "other@example.com",
      "Other",
    );
    const { execute, stop } = await createTestServer(otherToken);
    const result = await execute({
      query: `
        mutation UpdatePost($id: ID!) {
          updatePost(id: $id, title: "Hijacked") { id }
        }
      `,
      variables: { id: post.id },
    });
    await stop();

    if (result.body.kind === "single") {
      expect(result.body.singleResult.errors).toBeDefined();
      expect(result.body.singleResult.errors![0].extensions?.code).toBe(
        "FORBIDDEN",
      );
    }
  });

  it("should delete own post", async () => {
    const { token, user } = await createTestUser();
    const post = await testPrisma.post.create({
      data: { title: "Delete Me", content: "Gone", authorId: user.id },
    });
    const { execute, stop } = await createTestServer(token);
    const result = await execute({
      query: `
        mutation DeletePost($id: ID!) {
          deletePost(id: $id) { id title }
        }
      `,
      variables: { id: post.id },
    });
    await stop();

    if (result.body.kind === "single") {
      expect(result.body.singleResult.errors).toBeUndefined();
      const data = result.body.singleResult.data as any;
      expect(data?.deletePost.title).toBe("Delete Me");
    }
    const deleted = await testPrisma.post.findUnique({
      where: { id: post.id },
    });
    expect(deleted).toBeNull();
  });

  it("should query posts with pagination", async () => {
    const { user } = await createTestUser();
    for (let i = 0; i < 5; i++) {
      await testPrisma.post.create({
        data: {
          title: `Post ${i}`,
          content: `Content ${i}`,
          published: true,
          authorId: user.id,
        },
      });
    }
    const { execute, stop } = await createTestServer();
    const result = await execute({
      query: `
        query {
          posts(first: 3, published: true) {
            edges { cursor node { id title } }
            pageInfo { hasNextPage hasPreviousPage startCursor endCursor }
            totalCount
          }
        }
      `,
    });
    await stop();

    if (result.body.kind === "single") {
      expect(result.body.singleResult.errors).toBeUndefined();
      const data = (result.body.singleResult.data as any)?.posts;
      expect(data.edges).toHaveLength(3);
      expect(data.totalCount).toBe(5);
      expect(data.pageInfo.hasNextPage).toBe(true);
      expect(data.pageInfo.hasPreviousPage).toBe(false);

      const endCursor = data.pageInfo.endCursor;
      const { execute: execute2, stop: stop2 } = await createTestServer();
      const page2 = await execute2({
        query: `
          query Page2($after: String) {
            posts(first: 3, published: true, after: $after) {
              edges { node { title } }
              pageInfo { hasNextPage hasPreviousPage }
              totalCount
            }
          }
        `,
        variables: { after: endCursor },
      });
      await stop2();

      if (page2.body.kind === "single") {
        const data2 = (page2.body.singleResult.data as any)?.posts;
        expect(data2.edges).toHaveLength(2);
        expect(data2.pageInfo.hasNextPage).toBe(false);
        expect(data2.pageInfo.hasPreviousPage).toBe(true);
      }
    }
  });

  it("should resolve post author via DataLoader", async () => {
    const { user } = await createTestUser();
    await testPrisma.post.create({
      data: {
        title: "Loader Test",
        content: "Test content",
        published: true,
        authorId: user.id,
      },
    });
    const { execute, stop } = await createTestServer();
    const result = await execute({
      query: `
        query {
          posts(first: 1) {
            edges {
              node {
                title
                author { id email name }
              }
            }
          }
        }
      `,
    });
    await stop();

    if (result.body.kind === "single") {
      expect(result.body.singleResult.errors).toBeUndefined();
      const data = result.body.singleResult.data as any;
      const author = data?.posts.edges[0].node.author;
      expect(author.email).toBe("test@example.com");
    }
  });
});
