import { getPrisma } from "../config/prisma.js";
import {
  InsuranceEligibilityIssue,
  InsuranceVerificationField,
  InsuranceVerificationReason,
  type InsuranceMismatchField,
  type InsurancePolicyLookup,
  type InsuranceVerificationInput,
  type InsuranceVerificationResult,
} from "./insurance.types.js";

const findPolicyByNumber: InsurancePolicyLookup = (policyNumber) =>
  getPrisma().insurancePolicy.findUnique({
    where: { policy_number: policyNumber },
    select: {
      owner_demo_id: true,
      owner_name: true,
      plot_id: true,
      crop: true,
      season: true,
      season_year: true,
      policy_status: true,
      premium_status: true,
      coverage_start: true,
      coverage_end: true,
      covered_perils: true,
    },
  });

function normalizeText(value: string): string {
  return value.normalize("NFKC").trim().replace(/\s+/gu, " ").toLowerCase();
}

/** Input must first pass the controller's schema validation. */
export async function verifyInsuranceService(
  input: InsuranceVerificationInput,
  findPolicy: InsurancePolicyLookup = findPolicyByNumber,
): Promise<InsuranceVerificationResult> {
  const policy = await findPolicy(input.policy_number);
  if (!policy) {
    return { result: false, reason: InsuranceVerificationReason.NotFound };
  }

  if (input.owner_demo_id !== policy.owner_demo_id) {
    return { result: false, reason: InsuranceVerificationReason.OwnerMismatch };
  }

  // Hard eligibility failures take precedence over correctable field mismatches.
  const issues: InsuranceEligibilityIssue[] = [];
  if (policy.policy_status !== "active") {
    issues.push(InsuranceEligibilityIssue.PolicyNotActive);
  }
  if (policy.premium_status !== "paid") {
    issues.push(InsuranceEligibilityIssue.PremiumNotPaid);
  }
  const eventTime = Date.parse(`${input.event_date}T00:00:00.000Z`);
  if (eventTime < policy.coverage_start.getTime() || eventTime > policy.coverage_end.getTime()) {
    issues.push(InsuranceEligibilityIssue.EventOutsideCoverage);
  }
  if (!policy.covered_perils.includes(input.peril)) {
    issues.push(InsuranceEligibilityIssue.PerilNotCovered);
  }
  if (issues.length > 0) {
    return { result: false, reason: InsuranceVerificationReason.Ineligible, issues };
  }

  const mismatchedFields: InsuranceMismatchField[] = [];
  if (normalizeText(input.owner_name) !== normalizeText(policy.owner_name)) {
    mismatchedFields.push(InsuranceVerificationField.OwnerName);
  }
  if (input.plot_id !== policy.plot_id) {
    mismatchedFields.push(InsuranceVerificationField.PlotId);
  }
  if (normalizeText(input.crop) !== normalizeText(policy.crop)) {
    mismatchedFields.push(InsuranceVerificationField.Crop);
  }
  if (input.season !== policy.season) {
    mismatchedFields.push(InsuranceVerificationField.Season);
  }
  if (input.season_year !== policy.season_year) {
    mismatchedFields.push(InsuranceVerificationField.SeasonYear);
  }
  if (mismatchedFields.length > 0) {
    return {
      result: "partial",
      reason: InsuranceVerificationReason.DetailsMismatch,
      mismatchedFields,
    };
  }

  return { result: true, reason: InsuranceVerificationReason.Verified };
}
