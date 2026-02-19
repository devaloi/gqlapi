import DataLoader from "dataloader";
import type { PrismaClient, Post } from "@prisma/client";

export function createPostsByAuthorLoader(prisma: PrismaClient) {
  return new DataLoader<string, Post[]>(async (authorIds) => {
    const posts = await prisma.post.findMany({
      where: { authorId: { in: [...authorIds] } },
      orderBy: { createdAt: "desc" },
    });
    const postMap = new Map<string, Post[]>();
    for (const post of posts) {
      const list = postMap.get(post.authorId) ?? [];
      list.push(post);
      postMap.set(post.authorId, list);
    }
    return authorIds.map((id) => postMap.get(id) ?? []);
  });
}
