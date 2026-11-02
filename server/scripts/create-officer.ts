import "../src/config/env.js";
import { getPrisma } from "../src/config/prisma.js";
import { signupSchema } from "../src/auth/auth.schema.js";
import { hashPassword } from "../src/auth/password.js";

const prisma = getPrisma();
try {
  const result = signupSchema.safeParse({
    email: process.env.OFFICER_EMAIL, name: process.env.OFFICER_NAME, password: process.env.OFFICER_PASSWORD,
  });
  if (!result.success) throw new Error("Set OFFICER_EMAIL, OFFICER_NAME and OFFICER_PASSWORD (12–128 characters) in server/.env.local.");
  const { email, name, password } = result.data;
  if (await prisma.user.findUnique({ where: { email } })) throw new Error("That email is already registered. Existing accounts are never promoted by this command.");
  await prisma.user.create({ data: { email, name, password_hash: await hashPassword(password), role: "officer" } });
  console.log("Officer account created. Remove OFFICER_PASSWORD from your local environment after provisioning.");
} catch {
  console.error("Could not create officer. Check the provisioning values, ensure the email is unused, and apply migrations first.");
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
