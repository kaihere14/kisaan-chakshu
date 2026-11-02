import { Router } from "express";
import { createAuthController } from "./auth.controller.js";
import { createAuthRateLimit, requireMutation, requireSession } from "./auth.middleware.js";
import type { AuthService } from "./auth.service.js";

export function createAuthRouter(service?: AuthService): Router {
  const router = Router();
  const controller = createAuthController(service);
  const limit = createAuthRateLimit();
  router.use((_request, response, next) => { response.set("Cache-Control", "no-store"); next(); });
  router.post("/signup", requireMutation, limit, controller.signup);
  router.post("/login", requireMutation, limit, controller.login);
  router.post("/logout", requireMutation, controller.logout);
  router.get("/me", requireSession(service), controller.me);
  return router;
}
