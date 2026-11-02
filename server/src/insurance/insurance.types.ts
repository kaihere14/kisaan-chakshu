import type { CoveredPeril, CropSeason, InsurancePolicy, Prisma } from "../generated/prisma/client.js";

export type { InsurancePolicy, PolicyStatus, PremiumStatus, CoveredPeril, CropSeason } from "../generated/prisma/client.js";
export type InsurancePolicyInput = Prisma.InsurancePolicyCreateManyInput;

/** Claim details passed by another server module, never an Express request. */
export interface InsuranceVerificationInput {
  policy_number: string;
  owner_demo_id: string;
  owner_name: string;
  plot_id: string;
  crop: string;
  season: CropSeason;
  season_year: number;
  peril: CoveredPeril;
  /** A calendar date in YYYY-MM-DD format. */
  event_date: string;
}

export enum InsuranceVerificationReason {
  Verified = "verified",
  DetailsMismatch = "details_mismatch",
  NotFound = "not_found",
  OwnerMismatch = "owner_mismatch",
  Ineligible = "ineligible",
  InvalidInput = "invalid_input",
}

export enum InsuranceVerificationField {
  Input = "input",
  PolicyNumber = "policy_number",
  OwnerDemoId = "owner_demo_id",
  OwnerName = "owner_name",
  PlotId = "plot_id",
  Crop = "crop",
  Season = "season",
  SeasonYear = "season_year",
  Peril = "peril",
  EventDate = "event_date",
}

export enum InsuranceEligibilityIssue {
  PolicyNotActive = "policy_not_active",
  PremiumNotPaid = "premium_not_paid",
  EventOutsideCoverage = "event_outside_coverage",
  PerilNotCovered = "peril_not_covered",
}

export type InsuranceMismatchField =
  | InsuranceVerificationField.OwnerName
  | InsuranceVerificationField.PlotId
  | InsuranceVerificationField.Crop
  | InsuranceVerificationField.Season
  | InsuranceVerificationField.SeasonYear;

/** Check result === true explicitly: the string "partial" is truthy. */
export type InsuranceVerificationResult =
  | { result: true; reason: InsuranceVerificationReason.Verified }
  | {
      result: "partial";
      reason: InsuranceVerificationReason.DetailsMismatch;
      mismatchedFields: InsuranceMismatchField[];
    }
  | {
      result: false;
      reason: InsuranceVerificationReason.NotFound | InsuranceVerificationReason.OwnerMismatch;
    }
  | {
      result: false;
      reason: InsuranceVerificationReason.Ineligible;
      issues: InsuranceEligibilityIssue[];
    }
  | {
      result: false;
      reason: InsuranceVerificationReason.InvalidInput;
      invalidFields: InsuranceVerificationField[];
    };

/** Only the policy fields required by verification are read from Prisma. */
export type InsuranceVerificationPolicy = Pick<
  InsurancePolicy,
  | "owner_demo_id"
  | "owner_name"
  | "plot_id"
  | "crop"
  | "season"
  | "season_year"
  | "policy_status"
  | "premium_status"
  | "coverage_start"
  | "coverage_end"
  | "covered_perils"
>;

export type InsurancePolicyLookup = (
  policyNumber: string,
) => Promise<InsuranceVerificationPolicy | null>;
