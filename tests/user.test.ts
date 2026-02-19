import { describe, it, expect, beforeEach, afterAll } from "vitest";
import {
  createTestServer,
  resetDatabase,
  testPrisma,
  createTestUser,
} from "./setup.js";

/* eslint-disable @typescript-eslint/no-explicit-any */

describe("User", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await testPrisma.$disconnect();
  });

  it("should return current user with valid token", async () => {
    const { token } = await createTestUser("me@example.com", "Me User");
    const { execute, stop } = await createTestServer(token);
    const result = await execute({
      query: `query { me { id email name } }`,
    });
    await stop();

    if (result.body.kind === "single") {
      expect(result.body.singleResult.errors).toBeUndefined();
      const data = result.body.singleResult.data as any;
      expect(data?.me.email).toBe("me@example.com");
      expect(data?.me.name).toBe("Me User");
    }
  });

  it("should return null for me without auth", async () => {
    const { execute, stop } = await createTestServer();
    const result = await execute({
      query: `query { me { id } }`,
    });
    await stop();

    if (result.body.kind === "single") {
      expect(result.body.singleResult.errors).toBeUndefined();
      const data = result.body.singleResult.data as any;
      expect(data?.me).toBeNull();
    }
  });

  it("should query user by ID", async () => {
    const { user } = await createTestUser("byid@example.com", "ByID User");
    const { execute, stop } = await createTestServer();
    const result = await execute({
      query: `query GetUser($id: ID!) { user(id: $id) { id email name } }`,
      variables: { id: user.id },
    });
    await stop();

    if (result.body.kind === "single") {
      expect(result.body.singleResult.errors).toBeUndefined();
      const data = result.body.singleResult.data as any;
      expect(data?.user.email).toBe("byid@example.com");
    }
  });

  it("should return null for non-existent user", async () => {
    const { execute, stop } = await createTestServer();
    const result = await execute({
      query: `query { user(id: "nonexistent") { id } }`,
    });
    await stop();

    if (result.body.kind === "single") {
      expect(result.body.singleResult.errors).toBeUndefined();
      const data = result.body.singleResult.data as any;
      expect(data?.user).toBeNull();
    }
  });
});
