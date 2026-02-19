import DataLoader from "dataloader";
import type { PrismaClient, User } from "@prisma/client";

export function createUserLoader(prisma: PrismaClient) {
  return new DataLoader<string, User | null>(async (ids) => {
    const users = await prisma.user.findMany({
      where: { id: { in: [...ids] } },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));
    return ids.map((id) => userMap.get(id) ?? null);
  });
}
