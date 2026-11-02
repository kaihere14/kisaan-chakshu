import { config } from "dotenv";
import { fileURLToPath } from "node:url";

// Both src/config/ and compiled dist/config/ are two levels below server/.
// Local values take precedence over .env; nonempty shell values take precedence over both.
for (const filename of [".env.local", ".env"]) {
  const { parsed, error } = config({
    path: fileURLToPath(new URL(`../../${filename}`, import.meta.url)),
    processEnv: {},
    quiet: true,
  });

  if (error && (error as NodeJS.ErrnoException).code !== "ENOENT") {
    throw error;
  }

  for (const [name, value] of Object.entries(parsed ?? {})) {
    // Blank template entries must not mask values in the other file.
    if (value.trim() && !process.env[name]?.trim()) {
      process.env[name] = value;
    }
  }
}

// Read lazily so the health endpoint does not require database credentials.
export function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error("Set DATABASE_URL in server/.env.local to your PostgreSQL connection URL.");
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error("DATABASE_URL must be a valid PostgreSQL connection URL.");
  }
  if (!["postgresql:", "postgres:"].includes(parsedUrl.protocol) || !parsedUrl.hostname) {
    throw new Error("DATABASE_URL must be a valid PostgreSQL connection URL.");
  }

  return url;
}
