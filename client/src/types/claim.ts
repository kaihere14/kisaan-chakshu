// Browser-safe mirrors of the server's claim response and Prisma enum values.
// No Prisma runtime or server-only dependency is imported into the client.
export const seasons = ["kharif", "rabi", "zaid"] as const;
export const perils = ["flood", "lodging", "drought", "hailstorm", "unseasonal_rain"] as const;
export type ClaimStatus = "pending" | "queued" | "processing" | "awaiting_analysis" | "needs_correction" | "needs_review" | "failed";
export type InsuranceResult =
  | { result: true; reason: "verified" }
  | { result: "partial"; reason: "details_mismatch"; mismatchedFields: string[] }
  | { result: false; reason: "not_found" | "owner_mismatch" }
  | { result: false; reason: "ineligible"; issues: string[] }
  | { result: false; reason: "invalid_input"; invalidFields: string[] };

export interface ClaimFields {
  policy_number: string;
  owner_demo_id: string;
  owner_name: string;
  plot_id: string;
  crop: string;
  season: typeof seasons[number];
  season_year: number;
  peril: typeof perils[number];
  event_date: string;
}

export interface Claim extends ClaimFields {
  id: string;
  latitude: string | null;
  longitude: string | null;
  description: string | null;
  status: ClaimStatus;
  stage: "upload" | "dispatch" | "insurance" | "awaiting_analysis" | "finished";
  insurance_result: InsuranceResult | null;
  last_error: string | null;
  attempt_count: number;
  created_at: string;
  updated_at: string;
  queued_at: string | null;
  processing_started_at: string | null;
  finished_at: string | null;
  images: Array<{ id: string; url: string; file_name: string; mime_type: string; size_bytes: number; deleted_at: string | null }>;
}

export const statusDetails: Record<ClaimStatus, { label: string; description: string; tone: "green" | "amber" | "red" | "neutral" }> = {
  pending: { label: "Submitted", description: "Your claim is saved. Photos are uploading or the claim is waiting to be queued.", tone: "neutral" },
  queued: { label: "In the queue", description: "Your claim is waiting for its policy check.", tone: "neutral" },
  processing: { label: "Checking policy", description: "Your submitted details are being checked against the demo policy.", tone: "amber" },
  awaiting_analysis: { label: "Policy verified", description: "Your policy check passed. Evidence analysis is not available yet; your claim is saved and awaiting that stage.", tone: "green" },
  needs_correction: { label: "Details need attention", description: "Some submitted details do not match the policy. See the policy check below.", tone: "amber" },
  needs_review: { label: "Needs review", description: "The policy check needs further attention. See the reason below.", tone: "amber" },
  failed: { label: "Processing issue", description: "We could not complete this stage. Your saved claim and available details are shown below.", tone: "red" },
};

export const displayName = (value: string) => value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
export const formatDate = (value: string) => new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }).format(new Date(value));
