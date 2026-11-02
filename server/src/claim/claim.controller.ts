import type { Request, Response } from "express";
import { basename } from "node:path";
import { claimIdSchema, claimListSchema, claimSubmissionSchema, idempotencyKeySchema } from "./claim.schema.js";
import { authenticatedUser } from "../auth/auth.middleware.js";
import { getClaimService, type ClaimService } from "./claim.service.js";

export function createClaimController(service?: ClaimService) {
  return {
    async submit(request: Request, response: Response): Promise<void> {
      const input = claimSubmissionSchema.parse(request.body);
      const key = idempotencyKeySchema.parse(request.get("Idempotency-Key"));
      const files = (Array.isArray(request.files) ? request.files : []).map((file) => ({
        buffer: file.buffer,
        fileName: basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100) || "photo",
        mimeType: file.mimetype,
      }));
      const result = await (service ?? getClaimService()).submitClaim(input, files, key, authenticatedUser(request).id);
      response.status(result.replayed ? 200 : 202).location(`/api/claims/${result.claim.id}`).json(result);
    },
    async get(request: Request, response: Response): Promise<void> {
      const id = claimIdSchema.parse(request.params.id);
      response.json({ claim: await (service ?? getClaimService()).getOwnedClaim(id, authenticatedUser(request).id) });
    },
    async list(request: Request, response: Response): Promise<void> {
      const { page } = claimListSchema.parse(request.query);
      response.json(await (service ?? getClaimService()).listClaims(authenticatedUser(request).id, page));
    },
  };
}
