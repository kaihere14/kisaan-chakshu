import assert from "node:assert/strict";
import { test } from "node:test";
import { claimSubmissionSchema, idempotencyKeySchema } from "../src/claim/claim.schema.js";
import { validateClaimPhotos } from "../src/claim/claim.service.js";
import { HttpError } from "../src/utils/http-error.js";

const fields = {
  policy_number: "DEMO-KC-POL-0001", owner_demo_id: "DEMO-FARMER-0001",
  owner_name: "Demo Farmer 0001", plot_id: "DEMO-PLOT-0001", crop: "paddy",
  season: "kharif", season_year: "2026", peril: "flood", event_date: "2026-10-15",
};
const photo = { buffer: Buffer.from([137,80,78,71,13,10,26,10]), fileName: "photo.png", mimeType: "image/png" };

test("multipart strings become typed fields; missing GPS stays missing", () => {
  const parsed = claimSubmissionSchema.parse(fields);
  assert.equal(parsed.season_year, 2026);
  assert.equal(parsed.latitude, undefined);
});
test("GPS must contain both valid coordinates", () => {
  assert(!claimSubmissionSchema.safeParse({ ...fields, latitude: "30" }).success);
  assert(!claimSubmissionSchema.safeParse({ ...fields, latitude: "91", longitude: "70" }).success);
  assert.equal(claimSubmissionSchema.parse({ ...fields, latitude: "30", longitude: "70" }).longitude, 70);
});
test("claim validation preserves insurance date and enum restrictions", () => {
  assert(!claimSubmissionSchema.safeParse({ ...fields, event_date: "2026-02-30" }).success);
  assert(!claimSubmissionSchema.safeParse({ ...fields, peril: "unknown" }).success);
});
test("idempotency keys accept UUID-style values and reject unsafe or missing keys", () => {
  assert(idempotencyKeySchema.safeParse("claim-00000001").success);
  assert(!idempotencyKeySchema.safeParse("short").success);
  assert(!idempotencyKeySchema.safeParse(undefined).success);
});
test("photo validation rejects missing, oversized and mismatched content", () => {
  assert.doesNotThrow(() => validateClaimPhotos([photo]));
  assert.throws(() => validateClaimPhotos([]), (e) => e instanceof HttpError && e.statusCode === 400);
  assert.throws(() => validateClaimPhotos(Array(6).fill(photo)), (e) => e instanceof HttpError && e.statusCode === 400);
  assert.throws(() => validateClaimPhotos([{ ...photo, buffer: Buffer.alloc(5 * 1024 * 1024 + 1) }]), (e) => e instanceof HttpError && e.statusCode === 413);
  assert.throws(() => validateClaimPhotos([{ ...photo, mimeType: "image/jpeg" }]), (e) => e instanceof HttpError && e.statusCode === 415);
});
