import { createHash, randomBytes } from "node:crypto";
import type { z } from "zod";
import type { PrismaClient } from "../generated/prisma/client.js";
import { getPrisma } from "../config/prisma.js";
import { HttpError } from "../utils/http-error.js";
import { hashPassword, verifyPassword } from "./password.js";
import type { signupSchema, loginSchema } from "./auth.schema.js";
import type { AuthUser } from "./auth.types.js";

export const SESSION_SECONDS = 7 * 24 * 60 * 60;
const publicUser = { id: true, email: true, name: true, role: true } as const;
const tokenHash = (token: string) => createHash("sha256").update(token).digest("hex");
// Unknown emails still perform the same password derivation as known emails.
const dummyHash = `scrypt:00000000000000000000000000000000:${"00".repeat(64)}`;

export function createAuthService(prisma: PrismaClient) {
  async function startSession(user: AuthUser) {
    const token = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + SESSION_SECONDS * 1000);
    await prisma.session.create({ data: { token_hash: tokenHash(token), user_id: user.id, expires_at: expires } });
    return { user, token };
  }

  return {
    async signup(input: z.infer<typeof signupSchema>) {
      const password_hash = await hashPassword(input.password);
      try {
        // Role is deliberately independent of request fields.
        const user = await prisma.user.create({ data: {
          email: input.email, name: input.name, password_hash, role: "farmer",
        }, select: publicUser });
        return await startSession(user);
      } catch (error) {
        if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
          throw new HttpError(409, "email_in_use", "An account with that email already exists. Please sign in.");
        }
        throw error;
      }
    },
    async login(input: z.infer<typeof loginSchema>) {
      const saved = await prisma.user.findUnique({ where: { email: input.email } });
      const valid = await verifyPassword(input.password, saved?.password_hash ?? dummyHash);
      if (!saved || !valid) throw new HttpError(401, "invalid_credentials", "Email or password is incorrect.");
      return startSession({ id: saved.id, email: saved.email, name: saved.name, role: saved.role });
    },
    async getUser(token: string): Promise<AuthUser | null> {
      if (!/^[a-f0-9]{64}$/.test(token)) return null;
      const session = await prisma.session.findUnique({ where: { token_hash: tokenHash(token) }, include: { user: { select: publicUser } } });
      if (!session || session.expires_at.getTime() <= Date.now()) return null;
      return session.user;
    },
    async logout(token: string): Promise<void> {
      await prisma.session.deleteMany({ where: { token_hash: tokenHash(token) } });
    },
  };
}

export type AuthService = ReturnType<typeof createAuthService>;
let service: AuthService | undefined;
export const getAuthService = () => service ??= createAuthService(getPrisma());
