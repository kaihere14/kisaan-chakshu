import { Router } from "express";
import { createClaimController } from "./claim.controller.js";
import type { ClaimService } from "./claim.service.js";
import { uploadClaimPhotos } from "../middleware/upload.middleware.js";
import { HttpError } from "../utils/http-error.js";

export function createClaimRouter(service?: ClaimService): Router {
  const router = Router();
  const controller = createClaimController(service);
  router.post("/", (request, _response, next) => {
    if (!request.is("multipart/form-data")) {
      next(new HttpError(415, "multipart_required", "Submit claim fields and photos as multipart/form-data."));
      return;
    }
    next();
  }, uploadClaimPhotos, controller.submit);
  router.get("/:id", controller.get);
  return router;
}
