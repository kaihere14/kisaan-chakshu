import type { InsurancePolicyInput } from "../src/insurance/insurance.types.js";

export const SEED_BATCH = "kisaan-chakshu-demo-v1";
export const DEMO_EVENT_DATE = "2026-10-15";

const locations = [
  { state: "Punjab", district: "Ludhiana", latitude: 30.901, longitude: 75.857, crop: "paddy" },
  { state: "Haryana", district: "Karnal", latitude: 29.686, longitude: 76.99, crop: "paddy" },
  { state: "Andhra Pradesh", district: "Kakinada", latitude: 16.989, longitude: 82.247, crop: "paddy" },
  { state: "Rajasthan", district: "Kota", latitude: 25.213, longitude: 75.864, crop: "soybean" },
  { state: "Maharashtra", district: "Nashik", latitude: 19.997, longitude: 73.79, crop: "maize" },
] as const;

// Fixed identifiers/dates make reruns and demo claim inputs reproducible.
// Locations are illustrative centers, not surveyed plot boundaries.
export function buildDemoPolicies(): InsurancePolicyInput[] {
  return Array.from({ length: 150 }, (_, index) => {
    const number = index + 1;
    const suffix = String(number).padStart(4, "0");
    const location = locations[index % locations.length]!;
    const policyStatus = number <= 105 ? "active"
      : number <= 125 ? "expired"
      : number <= 140 ? "cancelled" : "inactive";
    const premiumStatus = number <= 90 ? "paid"
      : number <= 105 ? "unpaid"
      : number <= 140 ? "paid" : "pending";
    const year = policyStatus === "expired" ? 2025 : 2026;
    const area = Number((0.5 + (index % 20) * 0.25).toFixed(2));
    const sumInsured = area * 50000;

    return {
      policy_number: `DEMO-KC-POL-${suffix}`,
      application_number: `DEMO-KC-APP-${suffix}`,
      insurer_name: "Kisaan Chakshu Demo Insurer (Fictional)",
      scheme_name: "DEMO_CROP_INSURANCE",
      owner_demo_id: `DEMO-FARMER-${suffix}`,
      owner_name: `Demo Farmer ${suffix}`,
      owner_phone: null,
      owner_email: `farmer-${suffix}@example.invalid`,
      ownership_type: number % 3 === 0 ? "tenant" : number % 3 === 1 ? "owner" : "leaseholder",
      village: `Demo Village ${String(index % 25 + 1).padStart(2, "0")}`,
      district: location.district,
      state: location.state,
      plot_id: `DEMO-PLOT-${suffix}`,
      plot_latitude: Number((location.latitude + (index % 10) * 0.001).toFixed(6)),
      plot_longitude: Number((location.longitude + (index % 10) * 0.001).toFixed(6)),
      insured_area_hectares: area,
      crop: location.crop,
      season: "kharif",
      season_year: year,
      covered_perils: number % 3 === 1 ? ["flood", "lodging"]
        : number % 3 === 2 ? ["flood", "drought"] : ["hailstorm", "unseasonal_rain"],
      issued_on: new Date(`${year}-05-15T00:00:00.000Z`),
      coverage_start: new Date(`${year}-06-01T00:00:00.000Z`),
      coverage_end: new Date(`${year}-11-30T00:00:00.000Z`),
      sum_insured_inr: sumInsured,
      premium_amount_inr: Number((sumInsured * 0.02).toFixed(2)),
      premium_status: premiumStatus,
      policy_status: policyStatus,
      is_synthetic: true,
      seed_batch: SEED_BATCH,
    };
  });
}
