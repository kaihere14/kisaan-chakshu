import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import { isIP } from "node:net";
import type { RedisOptions } from "ioredis";

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

export function getRedisConfig(environment: NodeJS.ProcessEnv = process.env): RedisOptions {
  const host = environment.REDIS_HOST?.trim();
  if (!host || /[\s/@]/u.test(host)) {
    throw new Error("Set REDIS_HOST to the Redis hostname (without a protocol) in server/.env.local.");
  }
  const portValue = environment.REDIS_PORT?.trim() || "6379";
  const port = Number(portValue);
  if (!/^\d+$/u.test(portValue) || !Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("REDIS_PORT must be an integer between 1 and 65535.");
  }
  const tlsValue = environment.REDIS_TLS?.trim().toLowerCase() || "false";
  if (tlsValue !== "true" && tlsValue !== "false") {
    throw new Error("REDIS_TLS must be true or false.");
  }
  return {
    host,
    port,
    username: environment.REDIS_USERNAME?.trim() || undefined,
    // Passwords may contain significant whitespace; do not trim them.
    password: environment.REDIS_PASSWORD || undefined,
    ...(tlsValue === "true" ? { tls: isIP(host) ? {} : { servername: host } } : {}),
  };
}

export function getImageKitConfig(): { privateKey: string; urlEndpoint: string } {
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY?.trim();
  const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT?.trim();
  if (!privateKey || !urlEndpoint) {
    throw new Error("Set IMAGEKIT_PRIVATE_KEY and IMAGEKIT_URL_ENDPOINT in server/.env.local before uploading claim photos.");
  }
  const parsed = new URL(urlEndpoint);
  if (parsed.protocol !== "https:") throw new Error("IMAGEKIT_URL_ENDPOINT must use HTTPS.");
  return { privateKey, urlEndpoint };
}
