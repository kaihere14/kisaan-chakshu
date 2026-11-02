import assert from "node:assert/strict";
import { randomUUID, createHash } from "node:crypto";
import { once } from "node:events";
import { test } from "node:test";
import express from "express";
import type { PrismaClient, User } from "../src/generated/prisma/client.js";
import { createAuthService } from "../src/auth/auth.service.js";
import { createAuthRouter } from "../src/auth/auth.route.js";
import { createAuthRateLimit } from "../src/auth/auth.middleware.js";
import { signupSchema } from "../src/auth/auth.schema.js";
import { hashPassword, verifyPassword } from "../src/auth/password.js";
import { errorMiddleware } from "../src/middleware/error.middleware.js";
import { createClaimRouter } from "../src/claim/claim.route.js";
import { createClaimService, type ClaimService } from "../src/claim/claim.service.js";
import type { ClaimSubmissionInput, ClaimWithImages } from "../src/claim/claim.types.js";
import { HttpError } from "../src/utils/http-error.js";

function memoryAuth() {
  const users: User[] = [];
  const sessions = new Map<string, { user_id: string; expires_at: Date }>();
  const prisma = {
    user: {
      async create({ data }: { data: Omit<User, "id" | "created_at"> }) {
        if (users.some((user) => user.email === data.email)) throw { code: "P2002" };
        const user = { ...data, id: randomUUID(), created_at: new Date() };
        users.push(user);
        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
      async findUnique({ where }: { where: { email: string } }) { return users.find((user) => user.email === where.email) ?? null; },
    },
    session: {
      async create({ data }: { data: { token_hash: string; user_id: string; expires_at: Date } }) { sessions.set(data.token_hash, data); },
      async findUnique({ where }: { where: { token_hash: string } }) {
        const session = sessions.get(where.token_hash);
        const saved = session && users.find((user) => user.id === session.user_id);
        return session && saved ? { ...session, user: { id: saved.id, name: saved.name, email: saved.email, role: saved.role } } : null;
      },
      async deleteMany({ where }: { where: { token_hash: string } }) { sessions.delete(where.token_hash); },
    },
  } as unknown as PrismaClient;
  return { service: createAuthService(prisma), users, sessions };
}

test("password hashing uses a unique salt and verifies without saving plaintext", async () => {
  const first = await hashPassword("a long test passphrase");
  const second = await hashPassword("a long test passphrase");
  assert.notEqual(first, second);
  assert(!first.includes("passphrase"));
  assert(await verifyPassword("a long test passphrase", first));
  assert(!await verifyPassword("wrong password", first));
  assert(!await verifyPassword("a long test passphrase", "invalid"));
});

test("signup normalizes email, enforces password limits and cannot accept officer role", () => {
  assert.equal(signupSchema.parse({ name: " Farmer ", email: " FARMER@EXAMPLE.COM ", password: "long-passphrase" }).email, "farmer@example.com");
  assert(!signupSchema.safeParse({ name: "Farmer", email: "a@example.com", password: "short" }).success);
  assert(!signupSchema.safeParse({ name: "Farmer", email: "a@example.com", password: "long-passphrase", role: "officer" }).success);
});

test("sessions are hashed, expire, revoke on logout, and never expose passwords", async () => {
  const { service, users, sessions } = memoryAuth();
  const { user, token } = await service.signup({ name: "Farmer", email: "farmer@example.invalid", password: "long-passphrase" });
  assert.equal(user.role, "farmer");
  assert(!("password_hash" in user));
  assert.notEqual(users[0]!.password_hash, "long-passphrase");
  assert(!sessions.has(token));
  assert(sessions.has(createHash("sha256").update(token).digest("hex")));
  assert.equal((await service.getUser(token))?.id, user.id);
  assert.equal(await service.getUser("malformed"), null);
  const session = [...sessions.values()][0]!;
  session.expires_at = new Date(Date.now() - 1000);
  assert.equal(await service.getUser(token), null);
  const login = await service.login({ email: user.email, password: "long-passphrase" });
  await service.logout(login.token);
  assert.equal(await service.getUser(login.token), null);
  await assert.rejects(service.login({ email: user.email, password: "wrong" }), (error: unknown) => error instanceof HttpError && error.statusCode === 401);
  await assert.rejects(service.login({ email: "missing@example.invalid", password: "wrong" }), (error: unknown) => error instanceof HttpError && error.statusCode === 401);
  await assert.rejects(service.signup({ name: "Farmer", email: user.email, password: "long-passphrase" }), (error: unknown) => error instanceof HttpError && error.statusCode === 409);
});

test("HTTP authentication, role enforcement, cross-origin requests and account-owned claim routes", async (t) => {
  const { service: auth, users, sessions } = memoryAuth();
  const ownedId = randomUUID();
  let ownerId = "";
  let submittedBy = "";
  const claims = {
    async listClaims(accountId: string, page: number) { return { claims: accountId === ownerId ? [{ id: ownedId }] : [], page, hasMore: false }; },
    async getOwnedClaim(id: string, accountId: string) {
      if (id !== ownedId || accountId !== ownerId) throw new HttpError(404, "claim_not_found", "Claim not found.");
      return { id };
    },
    async submitClaim(_input: unknown, _photos: unknown, _key: string, accountId: string) { submittedBy = accountId; return { claim: { id: ownedId }, replayed: false }; },
  } as unknown as ClaimService;
  const app = express();
  app.use(express.json());
  app.use("/api/auth", createAuthRouter(auth));
  app.use("/api/claims", createClaimRouter(claims, auth));
  app.use(errorMiddleware);
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(() => new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve())));
  const address = server.address();
  assert(address && typeof address !== "string");
  const base = `http://127.0.0.1:${address.port}`;
  const request = (path: string, options: RequestInit = {}) => fetch(`${base}${path}`, options);
  const headers = { "Content-Type": "application/json", "X-Requested-With": "KisaanChakshu" };
  const signup = (email: string, extra: Record<string, unknown> = {}) => request("/api/auth/signup", {
    method: "POST", headers, body: JSON.stringify({ name: "Farmer", email, password: "long-passphrase", ...extra }),
  });
  assert.equal((await request("/api/claims")).status, 401);
  assert.equal((await request("/api/claims", { method: "POST" })).status, 401);
  assert.equal((await request(`/api/claims/${ownedId}`)).status, 401);
  assert.equal((await request("/api/auth/signup", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" })).status, 403);
  assert.equal((await request("/api/auth/signup", { method: "POST", headers: { ...headers, Origin: "https://other.example" }, body: "{}" })).status, 403);
  assert.equal((await signup("role@example.invalid", { role: "officer" })).status, 400);
  const first = await signup("FIRST@example.invalid");
  assert.equal(first.status, 201);
  assert.equal(first.headers.get("cache-control"), "no-store");
  const body = await first.json() as { user: { id: string; role: string } };
  ownerId = body.user.id;
  assert(!JSON.stringify(body).includes("password"));
  assert.equal(body.user.role, "farmer");
  const cookie = first.headers.get("set-cookie")!;
  assert(cookie.includes("HttpOnly")); assert(cookie.includes("SameSite=Lax")); assert(cookie.includes("Path=/api"));
  const firstHeaders = { Cookie: cookie.split(";")[0]! };
  assert.equal((await request("/api/auth/me", { headers: firstHeaders })).status, 200);
  assert.equal((await request("/api/claims", { method: "POST", headers: { ...firstHeaders, ...headers }, body: "{}" })).status, 415);
  assert.equal((await request(`/api/claims/${ownedId}`, { headers: firstHeaders })).status, 200);
  assert.equal((await request("/api/claims?owner_demo_id=anything", { headers: firstHeaders })).status, 400);
  assert.equal((await request("/api/claims?page=0", { headers: firstHeaders })).status, 400);
  const second = await signup("second@example.invalid");
  const secondCookie = second.headers.get("set-cookie")!.split(";")[0]!;
  const otherClaims = await request("/api/claims", { headers: { Cookie: secondCookie } }).then((r) => r.json()) as { claims: unknown[] };
  assert.deepEqual(otherClaims.claims, []);
  assert.equal((await request(`/api/claims/${ownedId}`, { headers: { Cookie: secondCookie } })).status, 404);
  assert.equal((await request("/api/claims/not-a-uuid", { headers: firstHeaders })).status, 400);

  const form = new FormData();
  for (const [key, value] of Object.entries({ policy_number: "DEMO-KC-POL-0001", owner_demo_id: "DEMO-FARMER-0001", owner_name: "Demo Farmer 0001", plot_id: "DEMO-PLOT-0001", crop: "paddy", season: "kharif", season_year: "2026", peril: "flood", event_date: "2026-10-15", account_id: "forged-owner" })) form.set(key, value);
  form.append("photos", new Blob([Buffer.from([137,80,78,71,13,10,26,10])], { type: "image/png" }), "damage.png");
  assert.equal((await request("/api/claims", { method: "POST", headers: { ...firstHeaders, "X-Requested-With": "KisaanChakshu", "Idempotency-Key": "claim-test-0001" }, body: form })).status, 202);
  assert.equal(submittedBy, ownerId);
  users[1]!.role = "officer";
  assert.equal((await request("/api/claims", { headers: { Cookie: secondCookie } })).status, 403);
  const me = await request("/api/auth/me", { headers: { Cookie: secondCookie } }).then((r) => r.json()) as { user: { role: string } };
  assert.equal(me.user.role, "officer");
  assert.equal((await request("/api/auth/logout", { method: "POST", headers: { ...firstHeaders, "X-Requested-With": "KisaanChakshu" } })).status, 204);
  assert.equal((await request("/api/auth/me", { headers: firstHeaders })).status, 401);
  const secondToken = secondCookie.slice("kc_session=".length);
  sessions.get(createHash("sha256").update(secondToken).digest("hex"))!.expires_at = new Date(0);
  assert.equal((await request("/api/auth/me", { headers: { Cookie: secondCookie } })).status, 401);
  const login = await request("/api/auth/login", { method: "POST", headers, body: JSON.stringify({ email: "first@example.invalid", password: "long-passphrase" }) });
  assert.equal(login.status, 200);
});

test("claim retry reuses saved images and stays independent across accounts", async () => {
  const saved: ClaimWithImages[] = [];
  let uploads = 0;
  const claimDelegate = {
    async findUnique({ where }: { where: { id?: string; idempotency_key?: string } }) {
      return saved.find((claim) => where.id ? claim.id === where.id : claim.idempotency_key === where.idempotency_key) ?? null;
    },
    async create({ data }: { data: Omit<ClaimSubmissionInput, "event_date" | "latitude" | "longitude"> & Pick<ClaimWithImages, "event_date" | "idempotency_key" | "request_hash" | "account_id"> }) {
      const claim: ClaimWithImages = {
        latitude: null, longitude: null, description: null, insurance_result: null, last_error: null,
        queued_at: null, processing_started_at: null, finished_at: null, status: "pending", stage: "upload",
        attempt_count: 0, images_ready: false, processing_token: null, created_at: new Date(), updated_at: new Date(),
        ...data, id: randomUUID(), images: [],
      };
      saved.push(claim);
      return claim;
    },
    async updateMany({ where, data }: { where: { id: string }; data: Record<string, unknown> }) {
      Object.assign(saved.find((claim) => claim.id === where.id)!, data);
      return { count: 1 };
    },
  };
  const transaction = {
    claim: claimDelegate,
    claimImage: { async createMany({ data }: { data: Array<Record<string, unknown>> }) {
      for (const image of data) saved.find((claim) => claim.id === image.claim_id)!.images.push({ ...image, id: randomUUID(), deleted_at: null } as ClaimWithImages["images"][number]);
    } },
    claimOutbox: { async create() {} },
  };
  const prisma = { ...transaction, async $transaction<T>(callback: (value: typeof transaction) => Promise<T>) { return callback(transaction); } } as unknown as PrismaClient;
  const service = createClaimService({ prisma, images: {
    async upload() { uploads++; return { fileId: `file-${uploads}`, url: `https://example.invalid/photo-${uploads}.png` }; },
    async delete() {},
  } });
  const fields: ClaimSubmissionInput = { policy_number: "demo-policy", owner_demo_id: "demo-farmer", owner_name: "Farmer", plot_id: "plot", crop: "paddy", season: "kharif", season_year: 2026, peril: "flood", event_date: "2026-10-15" };
  const files = [{ buffer: Buffer.from([137,80,78,71,13,10,26,10]), fileName: "crop.png", mimeType: "image/png" }];
  const first = await service.submitClaim(fields, files, "same-browser-key", "farmer-A");
  const retry = await service.submitClaim(fields, files, "same-browser-key", "farmer-A");
  assert.equal(first.replayed, false); assert.equal(retry.replayed, true);
  assert.equal(retry.claim.id, first.claim.id); assert.equal(uploads, 1);
  assert(!("account_id" in first.claim)); assert(!("idempotency_key" in first.claim));
  assert(!("imagekit_file_id" in first.claim.images[0]!));
  await assert.rejects(service.submitClaim({ ...fields, crop: "wheat" }, files, "same-browser-key", "farmer-A"), (error: unknown) => error instanceof HttpError && error.statusCode === 409);
  const other = await service.submitClaim(fields, files, "same-browser-key", "farmer-B");
  assert.notEqual(other.claim.id, first.claim.id); assert.equal(uploads, 2);
  assert.deepEqual(saved.map((claim) => claim.account_id), ["farmer-A", "farmer-B"]);
});

test("authentication rate limiting stops repeated attempts and expires after 15 minutes", async (t) => {
  let time = 0;
  const app = express();
  app.use(express.json(), createAuthRateLimit(() => time));
  app.post("/", (_request, response) => { response.status(204).end(); });
  app.use(errorMiddleware);
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(() => new Promise<void>((resolve) => server.close(() => resolve())));
  const address = server.address();
  assert(address && typeof address !== "string");
  const send = () => fetch(`http://127.0.0.1:${address.port}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: "same@example.invalid" }) });
  for (let i = 0; i < 10; i++) assert.equal((await send()).status, 204);
  const limited = await send();
  assert.equal(limited.status, 429);
  assert.equal(limited.headers.get("Retry-After"), "900");
  time = 900_001;
  assert.equal((await send()).status, 204);
});

test("claim database reads always filter by account; history is bounded and stable", async () => {
  let detailWhere: unknown;
  let listArgs: unknown;
  const prisma = { claim: {
    async findFirst(args: unknown) { detailWhere = args; return null; },
    async findMany(args: unknown) { listArgs = args; return []; },
  } } as unknown as PrismaClient;
  const service = createClaimService({ prisma, images: { async upload() { throw new Error("unused"); }, async delete() {} } });
  await assert.rejects(service.getOwnedClaim("claim-id", "account-id"), (error: unknown) => error instanceof HttpError && error.statusCode === 404);
  assert.deepEqual((detailWhere as { where: unknown }).where, { id: "claim-id", account_id: "account-id" });
  assert.deepEqual(await service.listClaims("account-id", 2), { claims: [], page: 2, hasMore: false });
  const args = listArgs as { where: unknown; take: number; skip: number; orderBy: unknown };
  assert.deepEqual(args.where, { account_id: "account-id" });
  assert.equal(args.take, 21); assert.equal(args.skip, 20);
  assert.deepEqual(args.orderBy, [{ created_at: "desc" }, { id: "desc" }]);
});
