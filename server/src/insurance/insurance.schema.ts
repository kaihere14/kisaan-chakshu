import { z } from "zod";
import { CoveredPeril, CropSeason } from "../generated/prisma/enums.js";

const requiredText = z.string().trim().min(1);

export const insuranceVerificationSchema = z.object({
  policy_number: requiredText,
  owner_demo_id: requiredText,
  owner_name: requiredText,
  plot_id: requiredText,
  crop: requiredText,
  season: z.enum(CropSeason),
  season_year: z.number().int().min(2000).max(2100),
  peril: z.enum(CoveredPeril),
  event_date: z.iso.date(),
});
