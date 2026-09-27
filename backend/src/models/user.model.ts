import type { User } from "@prisma/client";

/**
 * The Prisma schema (prisma/schema.prisma) is the source of truth for the
 * database models. These "models" define the public shape sent to clients so
 * sensitive columns (passwordHash, tokenVersion) are never serialised.
 */
export interface PublicUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}
