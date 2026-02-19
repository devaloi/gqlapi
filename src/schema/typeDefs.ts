import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const loadSchema = (filename: string): string =>
  readFileSync(join(__dirname, filename), "utf-8");

const typeDefs = [
  loadSchema("common.graphql"),
  loadSchema("post.graphql"),
  loadSchema("user.graphql"),
];

export default typeDefs;
