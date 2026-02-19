import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import type { AuthUser } from "../resolvers/types.js";

const JWT_SECRET = process.env.JWT_SECRET ?? "default-secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "7d";

export function signToken(userId: string): string {
  return jwt.sign({ id: userId }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

export function verifyToken(token: string): AuthUser {
  const payload = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
  return { id: payload.id as string, email: payload.email as string };
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
