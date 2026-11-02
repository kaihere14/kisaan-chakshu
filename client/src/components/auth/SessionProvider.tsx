"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getCurrentUser, workspaceFor } from "@/services/auth.service";
import { ApiError } from "@/services/api";
import type { AuthUser } from "@/types/auth";

const SessionContext = createContext<AuthUser | null>(null);
export function useSession() {
  const user = useContext(SessionContext);
  if (!user) throw new Error("Session context is required.");
  return user;
}

export default function SessionProvider({ role, children }: { role: AuthUser["role"]; children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    getCurrentUser().then(({ user }) => {
      if (!active) return;
      if (user.role !== role) { router.replace(workspaceFor(user)); return; }
      setUser(user);
    }).catch((error: unknown) => {
      if (!active) return;
      if (error instanceof ApiError && error.status === 401) router.replace("/login");
      else setError(error instanceof Error ? error.message : "Unable to load your account.");
    });
    return () => { active = false; };
  }, [role, router, attempt]);
  if (!user) return <div className="portal-gate" role="status">{error ? <div><p>{error}</p><button className="kc-button" onClick={() => { setError(""); setAttempt(attempt + 1); }}>Try again</button><Link className="kc-text-link" href="/">Back to home</Link></div> : <p className="kc-loading">Opening your workspace…</p>}</div>;
  return <SessionContext.Provider value={user}>{children}</SessionContext.Provider>;
}
