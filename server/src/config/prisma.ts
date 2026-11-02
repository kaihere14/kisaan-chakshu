import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";
import { getDatabaseUrl } from "./env.js";

// Lazy creation keeps the health endpoint independent of database credentials.
let prisma: PrismaClient | undefined;

export function getPrisma(): PrismaClient {
  if (!prisma) {
    const adapter = new PrismaPg({ connectionString: getDatabaseUrl() });
    prisma = new PrismaClient({ adapter });
  }
  return prisma;
}
