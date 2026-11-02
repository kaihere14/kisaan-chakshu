"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight, FileText, Plus, RefreshCw, Sprout } from "lucide-react";
import { useSession } from "@/components/auth/SessionProvider";
import { listClaims } from "@/services/claim.service";
import { ApiError } from "@/services/api";
import { displayName, formatDate, type Claim } from "@/types/claim";
import ClaimStatus from "./ClaimStatus";

export default function ClaimHistory() {
  const user = useSession();
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ claims: Claim[]; hasMore: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true); setError("");
    listClaims(page).then((result) => { if (active) setData(result); }).catch((error: unknown) => {
      if (!active) return;
      if (error instanceof ApiError && error.status === 401) router.replace("/login");
      else setError(error instanceof Error ? error.message : "Unable to load claims.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [page, attempt, router]);

  return <>
    <div className="portal-page-heading"><div><span className="kc-eyebrow">A CLEARER JOURNEY, TOGETHER</span><h1 className="portal-title">Welcome, <em>{user.name.split(" ")[0]}.</em></h1><p className="kc-muted">A little more clarity for every season of hard work.</p></div><Link className="kc-button" href="/farmer/submit"><Plus size={17} /> Submit a new claim</Link></div>
    <section className="farmer-welcome" aria-labelledby="welcome-heading"><div><span className="kc-eyebrow">FROM YOUR FIELD TO REVIEW</span><h2 id="welcome-heading">Your harvest has a story.<br /><em>We’re here to help you share it.</em></h2><p>Submit crop damage details and photographs.<br />Follow your policy check, all in one place.</p><Link href="/farmer/submit">Start a claim <ArrowUpRight size={17} /></Link></div><div className="farmer-welcome-art" aria-hidden="true"><Sprout size={130} strokeWidth={.65} /><span>ROOTED IN CARE</span></div></section>
    <section aria-labelledby="claims-heading"><div className="claims-section-heading"><div><span className="kc-eyebrow">EVERY CLAIM, ONE PLACE</span><h2 id="claims-heading">My claims</h2></div><button className="kc-button kc-button-secondary kc-button-small" disabled={loading} onClick={() => setAttempt(attempt + 1)}><RefreshCw size={14} className={loading ? "kc-spin" : ""} /> Refresh</button></div>
      {error ? <div className="kc-alert kc-alert-error" role="alert">{error}<button className="kc-text-link" onClick={() => setAttempt(attempt + 1)}>Try again</button></div> : loading ? <div className="kc-card kc-empty" role="status"><p className="kc-loading">Loading your claims…</p></div> : !data?.claims.length ? <div className="kc-card kc-empty"><span className="kc-icon-tile"><FileText size={28} strokeWidth={1.4} /></span><h3>{page === 1 ? "A fresh start for your claims." : "No claims on this page."}</h3><p>{page === 1 ? "Your submitted claims will appear here. Have your policy details and crop photographs ready to begin." : "Go back to see your earlier results."}</p>{page === 1 && <Link href="/farmer/submit" className="kc-button">Submit your first claim <ArrowRight size={16} /></Link>}</div> : <div className="kc-card claims-table-card"><div className="claims-table-scroll"><table className="claims-table"><thead><tr><th scope="col">Crop & policy</th><th scope="col">Incident</th><th scope="col">Submitted</th><th scope="col">Status</th><th scope="col"><span className="sr-only">Details</span></th></tr></thead><tbody>{data.claims.map((claim) => <tr key={claim.id}><td><div className="claim-crop"><span className="claim-crop-icon"><Sprout size={20} strokeWidth={1.4} /></span><div><strong>{displayName(claim.crop)}</strong><small>{claim.policy_number}</small></div></div></td><td><strong>{displayName(claim.peril)}</strong><small>{formatDate(claim.event_date)}</small></td><td>{formatDate(claim.created_at)}</td><td><ClaimStatus status={claim.status} /></td><td><Link href={`/farmer/claims/${claim.id}`} className="claim-open" aria-label={`View ${claim.crop} claim ${claim.id}`}><ArrowUpRight size={18} /></Link></td></tr>)}</tbody></table></div></div>}
      {(page > 1 || data?.hasMore) && <div className="claims-pagination"><button className="kc-button kc-button-secondary kc-button-small" disabled={loading || page === 1} onClick={() => setPage(page - 1)}><ChevronLeft size={15} /> Previous</button><span>Page {page}</span><button className="kc-button kc-button-secondary kc-button-small" disabled={loading || !data?.hasMore} onClick={() => setPage(page + 1)}>Next <ChevronRight size={15} /></button></div>}
      <p className="claims-history-note">Showing claims submitted from your account, newest first. Historical demo claims without an account owner are not included.</p>
    </section>
  </>;
}
