import assert from "node:assert/strict";
import { test } from "node:test";
import { verifyInsurance } from "../src/insurance/insurance.controller.js";
import { insuranceVerificationSchema } from "../src/insurance/insurance.schema.js";
import { verifyInsuranceService } from "../src/insurance/insurance.service.js";
import {
  InsuranceEligibilityIssue as EligibilityIssue,
  InsuranceVerificationField as Field,
  InsuranceVerificationReason as Reason,
  type InsurancePolicyLookup,
  type InsuranceVerificationInput,
  type InsuranceVerificationPolicy,
} from "../src/insurance/insurance.types.js";

const input: InsuranceVerificationInput = {
  policy_number: "DEMO-KC-POL-0001",
  owner_demo_id: "DEMO-FARMER-0001",
  owner_name: "Demo Farmer 0001",
  plot_id: "DEMO-PLOT-0001",
  crop: "paddy",
  season: "kharif",
  season_year: 2026,
  peril: "flood",
  event_date: "2026-10-15",
};

const policy: InsuranceVerificationPolicy = {
  owner_demo_id: "DEMO-FARMER-0001",
  owner_name: "Demo Farmer 0001",
  plot_id: "DEMO-PLOT-0001",
  crop: "paddy",
  season: "kharif",
  season_year: 2026,
  policy_status: "active",
  premium_status: "paid",
  coverage_start: new Date("2026-06-01T00:00:00.000Z"),
  coverage_end: new Date("2026-11-30T00:00:00.000Z"),
  covered_perils: ["flood", "lodging"],
};

const lookup: InsurancePolicyLookup = async (number) => {
  assert.equal(number, input.policy_number);
  return policy;
};

test("matching policy and claim return true without leaking stored policy details", async () => {
  assert.deepEqual(await verifyInsuranceService(input, lookup), {
    result: true, reason: Reason.Verified,
  });
});

test("text normalization handles whitespace and case; identifiers are trimmed by the schema", async () => {
  const parsed = insuranceVerificationSchema.parse({
    ...input,
    policy_number: `  ${input.policy_number} `,
    owner_demo_id: ` ${input.owner_demo_id} `,
    plot_id: ` ${input.plot_id} `,
    owner_name: "  DEMO   FARMER 0001 ",
    crop: " PADDY ",
  });
  assert.deepEqual(await verifyInsuranceService(parsed, lookup), {
    result: true, reason: Reason.Verified,
  });
});

test("missing policy returns false/not_found", async () => {
  assert.deepEqual(await verifyInsuranceService(input, async () => null), {
    result: false, reason: Reason.NotFound,
  });
});

test("wrong farmer ID returns false before revealing any other mismatch", async () => {
  assert.deepEqual(await verifyInsuranceService({ ...input, owner_demo_id: "SOMEONE-ELSE" }, lookup), {
    result: false, reason: Reason.OwnerMismatch,
  });
});

const partialCases: Array<[InsuranceVerificationFieldKey, string | number, Field]> = [
  ["owner_name", "Different Farmer", Field.OwnerName],
  ["plot_id", "OTHER-PLOT", Field.PlotId],
  ["crop", "wheat", Field.Crop],
  ["season", "rabi", Field.Season],
  ["season_year", 2025, Field.SeasonYear],
];
type InsuranceVerificationFieldKey = "owner_name" | "plot_id" | "crop" | "season" | "season_year";

for (const [field, value, expected] of partialCases) {
  test(`${field} mismatch returns partial with the named field`, async () => {
    const changed = insuranceVerificationSchema.parse({ ...input, [field]: value });
    assert.deepEqual(await verifyInsuranceService(changed, lookup), {
      result: "partial", reason: Reason.DetailsMismatch, mismatchedFields: [expected],
    });
  });
}

test("all correctable mismatches are reported together", async () => {
  const result = await verifyInsuranceService({
    ...input, owner_name: "Different", plot_id: "OTHER", crop: "wheat", season: "rabi", season_year: 2025,
  }, lookup);
  assert.deepEqual(result, {
    result: "partial", reason: Reason.DetailsMismatch,
    mismatchedFields: [Field.OwnerName, Field.PlotId, Field.Crop, Field.Season, Field.SeasonYear],
  });
});

for (const status of ["expired", "inactive", "cancelled"] as const) {
  test(`${status} policies return false/ineligible`, async () => {
    assert.deepEqual(await verifyInsuranceService(input, async () => ({ ...policy, policy_status: status })), {
      result: false, reason: Reason.Ineligible, issues: [EligibilityIssue.PolicyNotActive],
    });
  });
}

for (const status of ["unpaid", "pending"] as const) {
  test(`${status} premiums return false/ineligible`, async () => {
    assert.deepEqual(await verifyInsuranceService(input, async () => ({ ...policy, premium_status: status })), {
      result: false, reason: Reason.Ineligible, issues: [EligibilityIssue.PremiumNotPaid],
    });
  });
}

for (const date of ["2026-06-01", "2026-11-30"]) {
  test(`coverage boundary ${date} is included`, async () => {
    assert.deepEqual(await verifyInsuranceService({ ...input, event_date: date }, lookup), {
      result: true, reason: Reason.Verified,
    });
  });
}

for (const date of ["2026-05-31", "2026-12-01"]) {
  test(`event outside coverage (${date}) returns false`, async () => {
    assert.deepEqual(await verifyInsuranceService({ ...input, event_date: date }, lookup), {
      result: false, reason: Reason.Ineligible, issues: [EligibilityIssue.EventOutsideCoverage],
    });
  });
}

test("uncovered peril returns false/ineligible", async () => {
  assert.deepEqual(await verifyInsuranceService({ ...input, peril: "drought" }, lookup), {
    result: false, reason: Reason.Ineligible, issues: [EligibilityIssue.PerilNotCovered],
  });
});

test("eligibility failures take precedence over partial matches and all issues are retained", async () => {
  const result = await verifyInsuranceService({
    ...input, crop: "wheat", event_date: "2027-01-01", peril: "drought",
  }, async () => ({ ...policy, policy_status: "cancelled", premium_status: "unpaid" }));
  assert.deepEqual(result, {
    result: false, reason: Reason.Ineligible,
    issues: [EligibilityIssue.PolicyNotActive, EligibilityIssue.PremiumNotPaid,
      EligibilityIssue.EventOutsideCoverage, EligibilityIssue.PerilNotCovered],
  });
});

test("database failures reject rather than returning false or partial", async () => {
  const failure = new Error("Database unavailable");
  await assert.rejects(verifyInsuranceService(input, async () => { throw failure; }), (error) => error === failure);
});

const invalidCases: Array<[string, unknown, Field]> = [
  ["blank policy number", { ...input, policy_number: " " }, Field.PolicyNumber],
  ["missing farmer ID", { ...input, owner_demo_id: undefined }, Field.OwnerDemoId],
  ["blank name", { ...input, owner_name: " " }, Field.OwnerName],
  ["blank plot", { ...input, plot_id: "" }, Field.PlotId],
  ["blank crop", { ...input, crop: "" }, Field.Crop],
  ["unknown season", { ...input, season: "winter" }, Field.Season],
  ["string year", { ...input, season_year: "2026" }, Field.SeasonYear],
  ["fractional year", { ...input, season_year: 2026.5 }, Field.SeasonYear],
  ["unknown peril", { ...input, peril: "earthquake" }, Field.Peril],
  ["impossible date", { ...input, event_date: "2026-02-30" }, Field.EventDate],
  ["invalid leap day", { ...input, event_date: "2025-02-29" }, Field.EventDate],
  ["timestamp instead of calendar date", { ...input, event_date: "2026-10-15T00:00:00Z" }, Field.EventDate],
  ["null input", null, Field.Input],
];

for (const [label, value, field] of invalidCases) {
  test(`controller rejects ${label} without a database lookup`, async () => {
    // Deliberately bypass static types to verify the boundary against malformed runtime values.
    assert.deepEqual(await verifyInsurance(value as InsuranceVerificationInput), {
      result: false, reason: Reason.InvalidInput, invalidFields: [field],
    });
  });
}
