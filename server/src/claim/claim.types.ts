import type { z } from "zod";
import type { Claim, ClaimImage } from "../generated/prisma/client.js";
import type { InsuranceVerificationResult } from "../insurance/insurance.types.js";
import type { claimSubmissionSchema } from "./claim.schema.js";

export type { ClaimStatus, ClaimStage } from "../generated/prisma/client.js";
export type ClaimSubmissionInput = z.infer<typeof claimSubmissionSchema>;

export interface ClaimUpload {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
}

export interface StoredClaimImage {
  fileId: string;
  url: string;
}

export interface ClaimImageStore {
  upload(claimId: string, file: ClaimUpload, index: number): Promise<StoredClaimImage>;
  delete(fileId: string): Promise<void>;
}

export interface ClaimJobData { claimId: string }
export type ClaimJobState = "missing" | "failed" | "other";
export interface ClaimQueueTransport {
  enqueue(claimId: string): Promise<void>;
  state(claimId: string): Promise<ClaimJobState>;
}

export type ClaimWithImages = Claim & { images: ClaimImage[] };
export type ClaimResponse = Omit<Claim,
  | "idempotency_key" | "request_hash" | "processing_token" | "images_ready" | "account_id"
  | "latitude" | "longitude" | "event_date" | "created_at" | "updated_at"
  | "queued_at" | "processing_started_at" | "finished_at" | "insurance_result"
> & {
  latitude: string | null;
  longitude: string | null;
  event_date: string;
  created_at: string;
  updated_at: string;
  queued_at: string | null;
  processing_started_at: string | null;
  finished_at: string | null;
  insurance_result: InsuranceVerificationResult | null;
  images: Array<{
    id: string;
    url: string;
    file_name: string;
    mime_type: string;
    size_bytes: number;
    deleted_at: string | null;
  }>;
};
