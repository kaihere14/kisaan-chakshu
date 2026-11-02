import { z } from "zod";
import { insuranceVerificationSchema } from "../insurance/insurance.schema.js";

const coordinate = (min: number, max: number) => z.preprocess(
  (value) => value === "" || value === undefined ? undefined : value,
  z.coerce.number().min(min).max(max).optional(),
);

export const claimSubmissionSchema = insuranceVerificationSchema.extend({
  season_year: z.coerce.number().int().min(2000).max(2100),
  latitude: coordinate(-90, 90),
  longitude: coordinate(-180, 180),
  description: z.string().trim().max(2000).optional(),
}).superRefine((input, context) => {
  if ((input.latitude === undefined) !== (input.longitude === undefined)) {
    context.addIssue({ code: "custom", message: "Provide both latitude and longitude, or neither.", path: ["latitude"] });
  }
});

export const idempotencyKeySchema = z.string().regex(/^[a-zA-Z0-9_-]{8,128}$/, "Idempotency-Key must contain 8–128 letters, numbers, hyphens or underscores.");
export const claimIdSchema = z.uuid();
export const MAX_CLAIM_PHOTOS = 5;
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
