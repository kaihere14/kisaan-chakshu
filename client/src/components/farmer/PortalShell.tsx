"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowUpRight, Eye, Leaf, LayoutDashboard, LogOut, Plus, ShieldCheck } from "lucide-react";
import { useSession } from "@/components/auth/SessionProvider";
import { logout } from "@/services/auth.service";

export default function PortalShell({ children }: { children: ReactNode }) {
  const user = useSession();
  const path = usePathname();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const farmer = user.role === "farmer";
  async function signOut() {
    setBusy(true); setError("");
    try { await logout(); router.replace("/login"); }
    catch { setError("Could not sign out. Please try again."); setBusy(false); }
  }
  return <div className="portal-root">
    <a href="#portal-main" className="kc-skip">Skip to content</a>
    <header className="portal-header"><div className="portal-header-inner">
      <Link href="/" className="kc-brand"><span className="kc-brand-mark"><Eye size={22} /><Leaf size={11} /></span>Kisaan<span>Chakshu</span></Link>
      <span className="portal-workspace">{farmer ? "Farmer" : "Officer"} workspace</span>
      <Link href="/" className="portal-home-link">Visit website <ArrowUpRight size={14} /></Link>
      <div className="portal-account"><span className="portal-avatar" aria-hidden="true">{user.name.charAt(0).toUpperCase()}</span><span className="portal-account-name">{user.name}<small>{user.role}</small></span><button onClick={signOut} disabled={busy} className="portal-signout" aria-label="Sign out" title="Sign out"><LogOut size={17} /></button></div>
    </div></header>
    <div className="portal-body"><aside className="portal-sidebar">
      <p className="kc-eyebrow">YOUR WORKSPACE</p><nav aria-label="Workspace navigation">
        <Link href={farmer ? "/farmer" : "/officer/dashboard"} className={path === (farmer ? "/farmer" : "/officer/dashboard") || path.startsWith("/farmer/claims/") ? "active" : ""}><LayoutDashboard size={18} />{farmer ? "My claims" : "Overview"}</Link>
        {farmer && <Link href="/farmer/submit" className={path === "/farmer/submit" ? "active" : ""}><Plus size={19} />New claim</Link>}
      </nav><div className="portal-sidebar-note"><span className="kc-icon-tile"><Leaf size={23} strokeWidth={1.4} /></span><h3>Every harvest matters.</h3><p>Keep your policy details and crop photographs ready. We’ll help you take the next step.</p></div><div className="portal-demo"><span /> SYNTHETIC DATA DEMO</div>
    </aside><main id="portal-main" className="portal-main">{error && <div role="alert" className="kc-alert kc-alert-error">{error}</div>}{children}<footer className="portal-footer"><span>Kisaan Chakshu · Built for Bharat</span><span><ShieldCheck size={14} /> Human-led decisions</span></footer></main></div>
  </div>;
}
