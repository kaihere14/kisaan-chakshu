BEGIN;

-- CreateEnum
CREATE TYPE "ClaimStatus" AS ENUM ('pending', 'queued', 'processing', 'awaiting_analysis', 'needs_correction', 'needs_review', 'failed');

-- CreateEnum
CREATE TYPE "ClaimStage" AS ENUM ('upload', 'dispatch', 'insurance', 'awaiting_analysis', 'finished');

-- CreateTable
CREATE TABLE "claims" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "idempotency_key" VARCHAR(128) NOT NULL,
    "request_hash" CHAR(64) NOT NULL,
    "policy_number" TEXT NOT NULL,
    "owner_demo_id" TEXT NOT NULL,
    "owner_name" TEXT NOT NULL,
    "plot_id" TEXT NOT NULL,
    "crop" TEXT NOT NULL,
    "season" "CropSeason" NOT NULL,
    "season_year" INTEGER NOT NULL,
    "peril" "CoveredPeril" NOT NULL,
    "event_date" DATE NOT NULL,
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "description" TEXT,
    "status" "ClaimStatus" NOT NULL DEFAULT 'pending',
    "stage" "ClaimStage" NOT NULL DEFAULT 'upload',
    "images_ready" BOOLEAN NOT NULL DEFAULT false,
    "insurance_result" JSONB,
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "processing_token" UUID,
    "last_error" TEXT,
    "queued_at" TIMESTAMPTZ(6),
    "processing_started_at" TIMESTAMPTZ(6),
    "finished_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "claims_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "claim_images" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "claim_id" UUID NOT NULL,
    "imagekit_file_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "cleanup_pending" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "claim_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "claim_outbox" (
    "claim_id" UUID NOT NULL,
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "available_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dispatched_at" TIMESTAMPTZ(6),
    "last_error" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "claim_outbox_pkey" PRIMARY KEY ("claim_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "claims_idempotency_key_key" ON "claims"("idempotency_key");

-- CreateIndex
CREATE INDEX "claims_status_updated_at_idx" ON "claims"("status", "updated_at");

-- CreateIndex
CREATE INDEX "claims_policy_number_plot_id_event_date_idx" ON "claims"("policy_number", "plot_id", "event_date");

-- CreateIndex
CREATE UNIQUE INDEX "claim_images_imagekit_file_id_key" ON "claim_images"("imagekit_file_id");

-- CreateIndex
CREATE INDEX "claim_images_claim_id_idx" ON "claim_images"("claim_id");

-- CreateIndex
CREATE INDEX "claim_images_cleanup_pending_idx" ON "claim_images"("cleanup_pending");

-- CreateIndex
CREATE INDEX "claim_outbox_dispatched_at_available_at_idx" ON "claim_outbox"("dispatched_at", "available_at");

-- AddForeignKey
ALTER TABLE "claim_images" ADD CONSTRAINT "claim_images_claim_id_fkey" FOREIGN KEY ("claim_id") REFERENCES "claims"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claim_outbox" ADD CONSTRAINT "claim_outbox_claim_id_fkey" FOREIGN KEY ("claim_id") REFERENCES "claims"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Claim business state is private to the backend database user.
ALTER TABLE "claims" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "claim_images" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "claim_outbox" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "claims", "claim_images", "claim_outbox" FROM PUBLIC;

ALTER TABLE "claims"
  ADD CONSTRAINT "claim_attempts_nonnegative" CHECK (attempt_count >= 0),
  ADD CONSTRAINT "claim_year_range" CHECK (season_year BETWEEN 2000 AND 2100),
  ADD CONSTRAINT "claim_coordinate_pair" CHECK ((latitude IS NULL) = (longitude IS NULL)),
  ADD CONSTRAINT "claim_latitude_range" CHECK (latitude BETWEEN -90 AND 90),
  ADD CONSTRAINT "claim_longitude_range" CHECK (longitude BETWEEN -180 AND 180),
  ADD CONSTRAINT "claim_ready_before_processing" CHECK (status IN ('pending', 'failed') OR images_ready),
  ADD CONSTRAINT "claim_processing_token" CHECK (status <> 'processing' OR processing_token IS NOT NULL);
ALTER TABLE "claim_images"
  ADD CONSTRAINT "claim_photo_size" CHECK (size_bytes > 0 AND size_bytes <= 5242880);
ALTER TABLE "claim_outbox"
  ADD CONSTRAINT "claim_dispatch_attempts" CHECK (attempt_count >= 0);

COMMIT;
