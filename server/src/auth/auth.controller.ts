import type { Request, Response } from "express";
import { signupSchema, loginSchema } from "./auth.schema.js";
import { getAuthService, SESSION_SECONDS, type AuthService } from "./auth.service.js";
import { authenticatedUser, SESSION_COOKIE, sessionToken } from "./auth.middleware.js";

const cookieOptions = () => ({
  httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/api",
});

export function createAuthController(service?: AuthService) {
  return {
    async signup(request: Request, response: Response) {
      const result = await (service ?? getAuthService()).signup(signupSchema.parse(request.body));
      response.cookie(SESSION_COOKIE, result.token, { ...cookieOptions(), maxAge: SESSION_SECONDS * 1000 });
      response.status(201).json({ user: result.user });
    },
    async login(request: Request, response: Response) {
      const result = await (service ?? getAuthService()).login(loginSchema.parse(request.body));
      response.cookie(SESSION_COOKIE, result.token, { ...cookieOptions(), maxAge: SESSION_SECONDS * 1000 });
      response.json({ user: result.user });
    },
    async logout(request: Request, response: Response) {
      const token = sessionToken(request);
      if (token) await (service ?? getAuthService()).logout(token);
      response.clearCookie(SESSION_COOKIE, cookieOptions());
      response.status(204).end();
    },
    me(request: Request, response: Response) {
      response.json({ user: authenticatedUser(request) });
    },
  };
}
