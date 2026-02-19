import { describe, it, expect, afterAll } from "vitest";
import pubsub from "../src/services/pubsub.js";
import { POST_CREATED } from "../src/resolvers/post.resolver.js";

describe("Subscription (PubSub)", () => {
  afterAll(async () => {
    // No cleanup needed for in-memory PubSub
  });

  it("should receive postCreated events via PubSub", async () => {
    const received: unknown[] = [];

    const subId = await pubsub.subscribe(POST_CREATED, (payload: unknown) => {
      received.push(payload);
    });

    const mockPost = {
      id: "test-id",
      title: "New Post",
      content: "Content",
      published: false,
      authorId: "author-id",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await pubsub.publish(POST_CREATED, { postCreated: mockPost });

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(received).toHaveLength(1);
    expect(
      (received[0] as { postCreated: { title: string } }).postCreated.title,
    ).toBe("New Post");

    pubsub.unsubscribe(subId);
  });

  it("should deliver to multiple subscribers", async () => {
    const received1: unknown[] = [];
    const received2: unknown[] = [];

    const sub1 = await pubsub.subscribe(POST_CREATED, (p: unknown) => {
      received1.push(p);
    });
    const sub2 = await pubsub.subscribe(POST_CREATED, (p: unknown) => {
      received2.push(p);
    });

    await pubsub.publish(POST_CREATED, {
      postCreated: { id: "multi-test", title: "Multi" },
    });

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(received1).toHaveLength(1);
    expect(received2).toHaveLength(1);

    pubsub.unsubscribe(sub1);
    pubsub.unsubscribe(sub2);
  });
});
