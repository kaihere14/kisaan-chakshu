import { getPrisma } from "../src/config/prisma.js";
import { buildDemoPolicies, DEMO_EVENT_DATE, SEED_BATCH } from "./seed-data.js";

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.some((arg) => arg !== "--dry-run")) {
    throw new Error("Usage: bun run seed [--dry-run]");
  }

  const policies = buildDemoPolicies();
  if (args.includes("--dry-run")) {
    console.log(JSON.stringify({ seed_batch: SEED_BATCH, demo_event_date: DEMO_EVENT_DATE, policies }, null, 2));
    return;
  }

  const prisma = getPrisma();
  try {
    const { inserted, count } = await prisma.$transaction(async (transaction) => {
      const inserted = await transaction.insurancePolicy.createMany({
        data: policies,
        skipDuplicates: true,
      });
      const count = await transaction.insurancePolicy.count({ where: { seed_batch: SEED_BATCH } });
      if (count !== policies.length) {
        throw new Error(`Expected ${policies.length} policies in ${SEED_BATCH}, found ${count}. Check conflicting policy/application numbers.`);
      }
      return { inserted: inserted.count, count };
    });
    console.log(`Verified ${count} synthetic policies (${inserted} inserted). Existing policies were preserved.`);
    console.log(`Demo: DEMO-KC-POL-0001 / DEMO-FARMER-0001 / DEMO-PLOT-0001, paddy, flood, ${DEMO_EVENT_DATE}.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  if (error && typeof error === "object" && "code" in error && error.code === "P2021") {
    console.error("The insurance policy table is missing. Run bun run migration:deploy before seeding.");
  } else {
    console.error(error instanceof Error ? error.message : "Database seed failed.");
  }
  process.exitCode = 1;
});
