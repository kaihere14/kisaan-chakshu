import "./src/config/env.js";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Generate/validate work without credentials; database commands require this URL.
    url: process.env.DATABASE_URL?.trim() || undefined,
  },
});
