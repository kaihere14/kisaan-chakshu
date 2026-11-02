import { Router } from "express";
import { createClaimController } from "./claim.controller.js";
import type { ClaimService } from "./claim.service.js";
import { uploadClaimPhotos } from "../middleware/upload.middleware.js";
import { HttpError } from "../utils/http-error.js";
import { requireSession, requireRole, requireMutation } from "../auth/auth.middleware.js";
import type { AuthService } from "../auth/auth.service.js";

export function createClaimRouter(service?: ClaimService, auth?: AuthService): Router {
  const router = Router();
  const controller = createClaimController(service);
  router.use((_request, response, next) => { response.set("Cache-Control", "no-store"); next(); });
  router.use(requireSession(auth), requireRole("farmer"));
  router.get("/", controller.list);
  router.post("/", requireMutation, (request, _response, next) => {
    if (!request.is("multipart/form-data")) {
      next(new HttpError(415, "multipart_required", "Submit claim fields and photos as multipart/form-data."));
      return;
    }
    next();
  }, uploadClaimPhotos, controller.submit);
  router.get("/:id", controller.get);
  return router;
}
