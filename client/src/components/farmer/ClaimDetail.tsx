"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Check, Clock, ExternalLink, FileCheck2, RefreshCw, ShieldCheck } from "lucide-react";
import { getClaim } from "@/services/claim.service";
import { ApiError } from "@/services/api";
import { displayName, formatDate, statusDetails, type Claim, type InsuranceResult } from "@/types/claim";
import ClaimStatus from "./ClaimStatus";

const reasons: Record<string, string> = {
  not_found: "No demo policy was found for the submitted policy number.",
  owner_mismatch: "The Demo Farmer ID does not match the owner of this policy.",
  policy_not_active: "The policy is not active.", premium_not_paid: "The policy premium is not recorded as paid.",
  event_outside_coverage: "The incident date falls outside the coverage dates.", peril_not_covered: "The reported damage type is not covered by this policy.",
};
function PolicyResult({ result }: { result: InsuranceResult | null }) {
  if (!result) return <p className="kc-muted">The policy check has not completed yet.</p>;
  if (result.result === true) return <div className="kc-alert kc-alert-success"><ShieldCheck size={19} /><div><strong>Policy details verified</strong><p>The submitted details match an eligible demo policy. Your claim is awaiting the future evidence analysis stage.</p></div></div>;
  if (result.result === "partial") return <><p>These details do not match the policy:</p><ul className="policy-reasons">{result.mismatchedFields.map((field) => <li key={field}>{displayName(field)}</li>)}</ul><p className="kc-muted">Corrections cannot be submitted in this version.</p></>;
  if (result.reason === "ineligible") return <ul className="policy-reasons">{result.issues.map((issue) => <li key={issue}>{reasons[issue] ?? displayName(issue)}</li>)}</ul>;
  if (result.reason === "invalid_input") return <><p>The following fields need attention:</p><ul className="policy-reasons">{result.invalidFields.map((field) => <li key={field}>{displayName(field)}</li>)}</ul></>;
  return <p>{reasons[result.reason] ?? "The policy check requires further review."}</p>;
}

export default function ClaimDetail({ id }: { id: string }) {
  const router = useRouter();
  const search = useSearchParams();
  const [claim, setClaim] = useState<Claim | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    async function load() {
      setRefreshing(true);
      try {
        const { claim } = await getClaim(id);
        if (!active) return;
        setClaim(claim); setError("");
        if (["pending", "queued", "processing"].includes(claim.status)) timer = setTimeout(load, 5000);
      } catch (error) {
        if (!active) return;
        if (error instanceof ApiError && error.status === 401) router.replace("/login");
        else setError(error instanceof ApiError && error.status === 404 ? "This claim could not be found in your account." : error instanceof Error ? error.message : "Unable to load this claim.");
      } finally { if (active) { setLoading(false); setRefreshing(false); } }
    }
    void load();
    return () => { active = false; clearTimeout(timer); };
  }, [id, attempt, router]);

  if (loading) return <div className="kc-card kc-empty" role="status"><p className="kc-loading">Loading your claim…</p></div>;
  const steps = claim ? [
    { title: "Claim saved", text: "Your details have been recorded.", done: true, active: false },
    { title: "Photos & queue", text: claim.stage === "upload" ? "Waiting for photo upload to finish." : "Photo upload stage complete.", done: claim.stage !== "upload", active: ["upload", "dispatch"].includes(claim.stage) && ["pending", "queued"].includes(claim.status) },
    { title: "Policy check", text: claim.insurance_result ? "See the result below." : "Your details are checked against the policy.", done: !!claim.insurance_result, active: claim.status === "processing" },
    { title: "Evidence analysis", text: "Planned · not available yet", done: false, active: false },
  ] : [];
  return <><Link href="/farmer" className="kc-back"><ArrowLeft size={15} /> Back to my claims</Link>
    {search.get("submitted") === "1" && claim && <div className="kc-alert kc-alert-success" role="status"><Check size={19} /><div><strong>Your claim has been saved.</strong><p>You can return here anytime to follow the policy check.</p></div></div>}
    {error && <div className="kc-alert kc-alert-error" role="alert">{error}<button className="kc-text-link" onClick={() => setAttempt(attempt + 1)}>Try again</button></div>}
    {claim && <><div className="portal-page-heading"><div><span className="kc-eyebrow">YOUR CLAIM JOURNEY</span><h1 className="portal-title">{displayName(claim.crop)} <em>claim.</em></h1><p className="claim-id">{claim.id}</p></div><button className="kc-button kc-button-secondary kc-button-small" onClick={() => setAttempt(attempt + 1)} disabled={refreshing}><RefreshCw size={14} className={refreshing ? "kc-spin" : ""} />Refresh status</button></div>
      <section className="kc-card claim-progress"><div className="claim-progress-top"><div><ClaimStatus status={claim.status} /><p>{statusDetails[claim.status].description}</p></div><span className="claim-updated">Updated {formatDate(claim.updated_at)}</span></div><ol className="claim-steps">{steps.map((step) => <li key={step.title} className={step.done ? "done" : step.active ? "current" : ""}><span className="claim-step-icon">{step.done ? <Check size={17} /> : <Clock size={17} />}</span><div><strong>{step.title}</strong><small>{step.text}</small></div></li>)}</ol>{claim.last_error && <div className="kc-alert kc-alert-error"><strong>Processing information</strong><p>{claim.last_error}</p></div>}</section>
      <div className="claim-detail-grid"><section className="kc-card detail-section"><div className="detail-section-title"><FileCheck2 size={21} /><h2>Claim details</h2></div><dl className="claim-facts">{[
        ["Farmer", claim.owner_name], ["Demo Farmer ID", claim.owner_demo_id], ["Policy number", claim.policy_number], ["Plot ID", claim.plot_id],
        ["Crop", displayName(claim.crop)], ["Season", `${displayName(claim.season)} ${claim.season_year}`], ["Damage type", displayName(claim.peril)], ["Incident date", formatDate(claim.event_date)], ["Submitted", formatDate(claim.created_at)],
        ["Coordinates", claim.latitude && claim.longitude ? `${claim.latitude}, ${claim.longitude}` : "Not provided"],
      ].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>{claim.description && <div className="claim-description"><h3>Your description</h3><p>{claim.description}</p></div>}</section>
      <section className="kc-card detail-section"><div className="detail-section-title"><ShieldCheck size={21} /><h2>Policy check</h2></div><PolicyResult result={claim.insurance_result} /><div className="detail-policy-note">A policy match is a screening result. Final insurance decisions and payouts are outside this MVP.</div></section></div>
      <section className="kc-card detail-section claim-evidence"><div className="claims-section-heading"><div><span className="kc-eyebrow">FROM THE FIELD</span><h2>Photo evidence</h2></div><span className="kc-muted">{claim.images.filter((image) => !image.deleted_at).length} photos</span></div><div className="claim-photo-grid">{claim.images.filter((image) => !image.deleted_at).map((image, index) => <a href={image.url} target="_blank" rel="noopener noreferrer" key={image.id} className="claim-photo"><img src={image.url} alt={`Submitted crop damage photograph ${index + 1}`} loading="lazy" /><span>{image.file_name}<ExternalLink size={14} /></span></a>)}</div>{!claim.images.some((image) => !image.deleted_at) && <p className="kc-muted">No uploaded photographs are available for this claim yet.</p>}</section>
    </>}
  </>;
}
