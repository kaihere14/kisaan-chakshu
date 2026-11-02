BEGIN;

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "PolicyStatus" AS ENUM ('active', 'expired', 'cancelled', 'inactive');

-- CreateEnum
CREATE TYPE "PremiumStatus" AS ENUM ('paid', 'unpaid', 'pending');

-- CreateEnum
CREATE TYPE "OwnershipType" AS ENUM ('owner', 'tenant', 'leaseholder');

-- CreateEnum
CREATE TYPE "CropSeason" AS ENUM ('kharif', 'rabi', 'zaid');

-- CreateEnum
CREATE TYPE "CoveredPeril" AS ENUM ('flood', 'lodging', 'drought', 'hailstorm', 'unseasonal_rain');

-- CreateTable
CREATE TABLE "insurance_policies" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "policy_number" TEXT NOT NULL,
    "application_number" TEXT NOT NULL,
    "insurer_name" TEXT NOT NULL,
    "scheme_name" TEXT NOT NULL,
    "owner_demo_id" TEXT NOT NULL,
    "owner_name" TEXT NOT NULL,
    "owner_phone" TEXT,
    "owner_email" TEXT,
    "ownership_type" "OwnershipType" NOT NULL,
    "village" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "plot_id" TEXT NOT NULL,
    "plot_latitude" DECIMAL(9,6) NOT NULL,
    "plot_longitude" DECIMAL(9,6) NOT NULL,
    "insured_area_hectares" DECIMAL(10,4) NOT NULL,
    "crop" TEXT NOT NULL,
    "season" "CropSeason" NOT NULL,
    "season_year" INTEGER NOT NULL,
    "covered_perils" "CoveredPeril"[],
    "issued_on" DATE NOT NULL,
    "coverage_start" DATE NOT NULL,
    "coverage_end" DATE NOT NULL,
    "sum_insured_inr" DECIMAL(14,2) NOT NULL,
    "premium_amount_inr" DECIMAL(12,2) NOT NULL,
    "premium_status" "PremiumStatus" NOT NULL,
    "policy_status" "PolicyStatus" NOT NULL,
    "is_synthetic" BOOLEAN NOT NULL DEFAULT false,
    "seed_batch" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "insurance_policies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "insurance_policies_policy_number_key" ON "insurance_policies"("policy_number");

-- CreateIndex
CREATE UNIQUE INDEX "insurance_policies_application_number_key" ON "insurance_policies"("application_number");

-- CreateIndex
CREATE INDEX "insurance_policies_owner_demo_id_idx" ON "insurance_policies"("owner_demo_id");

-- CreateIndex
CREATE INDEX "insurance_policies_plot_id_season_season_year_idx" ON "insurance_policies"("plot_id", "season", "season_year");

-- CreateIndex
CREATE INDEX "insurance_policies_seed_batch_idx" ON "insurance_policies"("seed_batch");


-- Database invariants beyond what the Prisma schema can express.
ALTER TABLE "insurance_policies"
  ADD CONSTRAINT "policy_number_not_blank" CHECK (length(trim(policy_number)) > 0),
  ADD CONSTRAINT "policy_owner_not_blank" CHECK (length(trim(owner_demo_id)) > 0 AND length(trim(owner_name)) > 0),
  ADD CONSTRAINT "policy_crop_not_blank" CHECK (length(trim(crop)) > 0),
  ADD CONSTRAINT "policy_latitude_range" CHECK (plot_latitude BETWEEN -90 AND 90),
  ADD CONSTRAINT "policy_longitude_range" CHECK (plot_longitude BETWEEN -180 AND 180),
  ADD CONSTRAINT "policy_insured_area_positive" CHECK (insured_area_hectares > 0),
  ADD CONSTRAINT "policy_year_range" CHECK (season_year BETWEEN 2000 AND 2100),
  ADD CONSTRAINT "policy_perils_present" CHECK (
    covered_perils IS NOT NULL AND cardinality(covered_perils) > 0
    AND array_position(covered_perils, NULL) IS NULL
  ),
  ADD CONSTRAINT "policy_coverage_dates" CHECK (coverage_end >= coverage_start),
  ADD CONSTRAINT "policy_issue_date" CHECK (issued_on <= coverage_start),
  ADD CONSTRAINT "policy_insured_sum_positive" CHECK (sum_insured_inr > 0),
  ADD CONSTRAINT "policy_premium_nonnegative" CHECK (premium_amount_inr >= 0),
  ADD CONSTRAINT "policy_seed_provenance" CHECK (seed_batch IS NULL OR is_synthetic);

-- Access goes through the backend's database user (the table owner).
ALTER TABLE "insurance_policies" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "insurance_policies" FROM PUBLIC;

COMMIT;
