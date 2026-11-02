import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const derive = promisify(scrypt);

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const key = await derive(password, salt, 64) as Buffer;
  return `scrypt:${salt}:${key.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algorithm, salt, encoded] = stored.split(":");
  if (algorithm !== "scrypt" || !salt || !encoded || !/^[a-f0-9]{128}$/.test(encoded)) return false;
  const key = await derive(password, salt, 64) as Buffer;
  return timingSafeEqual(key, Buffer.from(encoded, "hex"));
}
