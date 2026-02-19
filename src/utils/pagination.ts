export function encodeCursor(id: string): string {
  return Buffer.from(id).toString("base64");
}

export function decodeCursor(cursor: string): string {
  return Buffer.from(cursor, "base64").toString("utf-8");
}

export interface ConnectionArgs {
  first?: number | null;
  after?: string | null;
}

export interface Edge<T> {
  cursor: string;
  node: T;
}

export interface Connection<T> {
  edges: Edge<T>[];
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: string | null;
    endCursor: string | null;
  };
  totalCount: number;
}

export function buildConnection<T extends { id: string }>(
  nodes: T[],
  totalCount: number,
  args: ConnectionArgs,
): Connection<T> {
  const edges: Edge<T>[] = nodes.map((node) => ({
    cursor: encodeCursor(node.id),
    node,
  }));

  return {
    edges,
    pageInfo: {
      hasNextPage: nodes.length === (args.first ?? 10),
      hasPreviousPage: !!args.after,
      startCursor: edges.length > 0 ? edges[0].cursor : null,
      endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : null,
    },
    totalCount,
  };
}
