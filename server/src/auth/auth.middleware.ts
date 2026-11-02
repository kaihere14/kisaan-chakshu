import type { Request, RequestHandler } from "express";
import { HttpError } from "../utils/http-error.js";
import { getAuthService, type AuthService } from "./auth.service.js";
import type { AuthUser } from "./auth.types.js";

export const SESSION_COOKIE = "kc_session";

export function sessionToken(request: Request): string {
  return (request.headers.cookie ?? "").split(";").map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE}=`))?.slice(SESSION_COOKIE.length + 1) ?? "";
}

export function authenticatedUser(request: Request): AuthUser {
  if (!request.user) throw new HttpError(401, "authentication_required", "Please sign in to continue.");
  return request.user;
}

export const requireSession = (service?: AuthService): RequestHandler => async (request, _response, next) => {
  const token = sessionToken(request);
  const user = token ? await (service ?? getAuthService()).getUser(token) : null;
  if (!user) throw new HttpError(401, "authentication_required", "Please sign in to continue.");
  request.user = user;
  next();
};

export const requireRole = (role: AuthUser["role"]): RequestHandler => (request, _response, next) => {
  if (authenticatedUser(request).role !== role) throw new HttpError(403, "role_forbidden", "Your account cannot access this workspace.");
  next();
};

// A cross-site HTML form cannot supply this header. No cross-origin CORS is enabled.
// Origin is additionally checked when supplied by a browser.
export const requireMutation: RequestHandler = (request, _response, next) => {
  const origin = request.get("Origin");
  const allowed = new URL(process.env.APP_ORIGIN || "http://localhost:3000").origin;
  if (request.get("X-Requested-With") !== "KisaanChakshu" || (origin && origin !== allowed)) {
    throw new HttpError(403, "invalid_origin", "Submit this request from the Kisaan Chakshu application.");
  }
  next();
};

export function createAuthRateLimit(now: () => number = Date.now): RequestHandler {
  const attempts = new Map<string, { count: number; reset: number }>();
  return (request, response, next) => {
    const time = now();
    for (const [key, value] of attempts) if (value.reset <= time) attempts.delete(key);
    // Both IP and email limits prevent rotating email addresses or source addresses.
    const email = typeof request.body?.email === "string" ? request.body.email.trim().toLowerCase().slice(0, 254) : "";
    const keys = [`ip:${request.ip}`, `email:${email}`];
    for (const key of keys) {
      const value = attempts.get(key);
      if (value && value.count >= (key.startsWith("ip:") ? 50 : 10)) {
        response.set("Retry-After", String(Math.ceil((value.reset - time) / 1000)));
        throw new HttpError(429, "too_many_attempts", "Too many attempts. Please try again in 15 minutes.");
      }
    }
    if (attempts.size > 10_000) throw new HttpError(429, "too_many_attempts", "Please try again later.");
    for (const key of keys) {
      const value = attempts.get(key) ?? { count: 0, reset: time + 15 * 60_000 };
      value.count++;
      attempts.set(key, value);
    }
    next();
  };
}
