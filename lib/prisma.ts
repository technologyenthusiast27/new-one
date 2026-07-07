import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  __hobPrisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.__hobPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__hobPrisma = prisma;
}
