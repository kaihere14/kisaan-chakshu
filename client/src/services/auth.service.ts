import { api } from "./api";
import type { AuthUser } from "@/types/auth";

export const getCurrentUser = () => api<{ user: AuthUser }>("/auth/me");
export const login = (email: string, password: string) => api<{ user: AuthUser }>("/auth/login", {
  method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }),
});
export const signup = (name: string, email: string, password: string) => api<{ user: AuthUser }>("/auth/signup", {
  method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email, password }),
});
export const logout = () => api<void>("/auth/logout", { method: "POST" });
export const workspaceFor = (user: AuthUser) => user.role === "officer" ? "/officer/dashboard" : "/farmer";
