import { describe, it, expect, beforeEach, afterAll } from "vitest";
import {
  createTestServer,
  resetDatabase,
  testPrisma,
  createTestUser,
} from "./setup.js";

/* eslint-disable @typescript-eslint/no-explicit-any */

describe("Auth", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await testPrisma.$disconnect();
  });

  it("should signup a new user", async () => {
    const { execute, stop } = await createTestServer();
    const result = await execute({
      query: `
        mutation {
          signup(email: "new@example.com", password: "pass123", name: "New User") {
            token
            user { id email name }
          }
        }
      `,
    });
    await stop();

    expect(result.body.kind).toBe("single");
    if (result.body.kind === "single") {
      expect(result.body.singleResult.errors).toBeUndefined();
      const data = result.body.singleResult.data as any;
      expect(data?.signup.token).toBeTruthy();
      expect(data?.signup.user.email).toBe("new@example.com");
      expect(data?.signup.user.name).toBe("New User");
    }
  });

  it("should login with valid credentials", async () => {
    await createTestUser("login@example.com", "Login User", "mypassword");
    const { execute, stop } = await createTestServer();
    const result = await execute({
      query: `
        mutation {
          login(email: "login@example.com", password: "mypassword") {
            token
            user { id email }
          }
        }
      `,
    });
    await stop();

    if (result.body.kind === "single") {
      expect(result.body.singleResult.errors).toBeUndefined();
      const data = result.body.singleResult.data as any;
      expect(data?.login.token).toBeTruthy();
    }
  });

  it("should reject invalid credentials", async () => {
    await createTestUser("reject@example.com", "Reject User", "correctpass");
    const { execute, stop } = await createTestServer();
    const result = await execute({
      query: `
        mutation {
          login(email: "reject@example.com", password: "wrongpass") {
            token
            user { id }
          }
        }
      `,
    });
    await stop();

    if (result.body.kind === "single") {
      expect(result.body.singleResult.errors).toBeDefined();
      expect(result.body.singleResult.errors![0].message).toBe(
        "Invalid credentials",
      );
    }
  });

  it("should reject duplicate email on signup", async () => {
    await createTestUser("dup@example.com", "Dup User", "pass123");
    const { execute, stop } = await createTestServer();
    const result = await execute({
      query: `
        mutation {
          signup(email: "dup@example.com", password: "pass123", name: "Another") {
            token
            user { id }
          }
        }
      `,
    });
    await stop();

    if (result.body.kind === "single") {
      expect(result.body.singleResult.errors).toBeDefined();
    }
  });
});
