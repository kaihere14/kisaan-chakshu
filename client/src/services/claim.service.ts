import { api } from "./api";
import type { Claim } from "@/types/claim";

export const listClaims = (page = 1) => api<{ claims: Claim[]; page: number; hasMore: boolean }>(`/claims?page=${page}`);
export const getClaim = (id: string) => api<{ claim: Claim }>(`/claims/${encodeURIComponent(id)}`);
export const submitClaim = (form: FormData, key: string) => api<{ claim: Claim; replayed: boolean }>("/claims", {
  method: "POST", headers: { "Idempotency-Key": key }, body: form,
});
