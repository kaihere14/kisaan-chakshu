import { insuranceVerificationSchema } from "./insurance.schema.js";
import { verifyInsuranceService } from "./insurance.service.js";
import {
  InsuranceVerificationField,
  InsuranceVerificationReason,
  type InsuranceVerificationInput,
  type InsuranceVerificationResult,
} from "./insurance.types.js";

const knownFields = new Set<string>(Object.values(InsuranceVerificationField));

/** Internal controller called by claim/orchestration modules; no HTTP route. */
export async function verifyInsurance(
  input: InsuranceVerificationInput,
): Promise<InsuranceVerificationResult> {
  const parsed = insuranceVerificationSchema.safeParse(input);
  if (!parsed.success) {
    const invalidFields = [...new Set(parsed.error.issues.map((issue) => {
      const field = String(issue.path[0] ?? InsuranceVerificationField.Input);
      return knownFields.has(field)
        ? field as InsuranceVerificationField
        : InsuranceVerificationField.Input;
    }))];

    return {
      result: false,
      reason: InsuranceVerificationReason.InvalidInput,
      invalidFields,
    };
  }

  // Database failures intentionally propagate to the calling server module.
  return verifyInsuranceService(parsed.data);
}
