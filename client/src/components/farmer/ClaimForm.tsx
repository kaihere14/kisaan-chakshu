"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Camera, Check, FileText, ImagePlus, Leaf, MapPin, ShieldCheck, Sprout, X } from "lucide-react";
import { useSession } from "@/components/auth/SessionProvider";
import { submitClaim } from "@/services/claim.service";
import { ApiError } from "@/services/api";
import { displayName, perils, seasons } from "@/types/claim";

type Errors = Record<string, string>;
const MAX_SIZE = 5 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
function Field({ name, label, error, hint, children }: { name: string; label: string; error?: string; hint?: string; children: ReactNode }) {
  return <div className="kc-field"><label htmlFor={name}>{label}</label>{children}{hint && <small id={`${name}-hint`}>{hint}</small>}{error && <span className="kc-field-error" id={`${name}-error`}>{error}</span>}</div>;
}

export default function ClaimForm() {
  const user = useSession();
  const router = useRouter();
  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [errors, setErrors] = useState<Errors>({});
  const [error, setError] = useState("");
  const [savedId, setSavedId] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const [locked, setLocked] = useState(false);
  const [photoNotice, setPhotoNotice] = useState("");
  const pending = useRef<{ key: string; form: FormData } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const urls = photos.map((file) => URL.createObjectURL(file));
    setPreviews(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [photos]);

  function photoSelection(selected: FileList | null) {
    if (!selected) return;
    const added = Array.from(selected);
    setPhotoNotice("");
    if (photos.length + added.length > 5) { setPhotoNotice("Choose at most 5 photos in total."); return; }
    if (added.some((file) => !ACCEPTED.includes(file.type))) { setPhotoNotice("Choose JPEG, PNG or WebP photos."); return; }
    if (added.some((file) => file.size === 0 || file.size > MAX_SIZE)) { setPhotoNotice("Each photo must contain data and be at most 5 MiB."); return; }
    setPhotos([...photos, ...added]); setErrors((errors) => ({ ...errors, photos: "" }));
  }

  function fieldProps(name: string) { return { id: name, name, "aria-invalid": !!errors[name], "aria-describedby": errors[name] ? `${name}-error` : undefined }; }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setError(""); setSavedId(undefined);
    if (!pending.current) {
      const form = new FormData(event.currentTarget);
      const next: Errors = {};
      for (const name of ["policy_number", "owner_demo_id", "owner_name", "plot_id", "crop"]) {
        const value = String(form.get(name) ?? "").trim();
        if (!value) next[name] = "This field is required.";
        form.set(name, value);
      }
      const lat = String(form.get("latitude") ?? "").trim();
      const lng = String(form.get("longitude") ?? "").trim();
      if (!!lat !== !!lng) { next.latitude = "Provide both coordinates, or leave both blank."; next.longitude = next.latitude; }
      if (!photos.length) next.photos = "Add at least one crop damage photo.";
      setErrors(next);
      if (Object.keys(next).length) { setError("Check the highlighted fields before submitting."); return; }
      for (const photo of photos) form.append("photos", photo, photo.name);
      pending.current = { key: crypto.randomUUID(), form };
    }
    setBusy(true); setLocked(true);
    try {
      const result = await submitClaim(pending.current.form, pending.current.key);
      router.push(`/farmer/claims/${result.claim.id}?submitted=1`);
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 401) { router.replace("/login"); return; }
        setErrors(Object.fromEntries(error.fields.map((field) => [field.field, field.message])));
        setSavedId(error.claimId);
        // A validation response is guaranteed to happen before reservation; safe to edit.
        if ([400, 413, 415, 403, 429].includes(error.status)) { pending.current = null; setLocked(false); }
      }
      setError(error instanceof Error ? error.message : "Unable to submit. Please retry.");
      setBusy(false);
    }
  }

  return <>
    <Link href="/farmer" className="kc-back"><ArrowLeft size={15} /> Back to my claims</Link>
    <div className="portal-page-heading"><div><span className="kc-eyebrow">LET’S TAKE THE NEXT STEP</span><h1 className="portal-title">Tell us about <em>your crop.</em></h1><p className="kc-muted">A few details and photographs to start your claim journey.</p></div><span className="form-secure-note"><ShieldCheck size={17} /> Saved to your account</span></div>
    <div className="claim-form-layout"><form onSubmit={handleSubmit} className="claim-form">
      <fieldset disabled={busy || locked} className="claim-form-fields">
        <section className="kc-card form-section"><div className="form-section-title"><span>01</span><div><h2>Farmer & policy details</h2><p>Use the details recorded on your demo insurance policy.</p></div><FileText size={21} /></div><div className="kc-field-grid">
          <Field name="owner_name" label="Farmer name *" error={errors.owner_name}><input {...fieldProps("owner_name")} defaultValue={user.name} autoComplete="name" required /></Field>
          <Field name="owner_demo_id" label="Demo Farmer ID *" error={errors.owner_demo_id}><input {...fieldProps("owner_demo_id")} placeholder="DEMO-FARMER-0001" required /></Field>
          <Field name="policy_number" label="Policy number *" error={errors.policy_number}><input {...fieldProps("policy_number")} placeholder="DEMO-KC-POL-0001" required /></Field>
          <Field name="plot_id" label="Plot ID *" error={errors.plot_id}><input {...fieldProps("plot_id")} placeholder="DEMO-PLOT-0001" required /></Field>
        </div></section>
        <section className="kc-card form-section"><div className="form-section-title"><span>02</span><div><h2>Crop & incident</h2><p>Help us understand what happened and when.</p></div><Sprout size={22} /></div><div className="kc-field-grid">
          <Field name="crop" label="Crop name *" error={errors.crop} hint="Enter the crop as recorded on your policy."><input {...fieldProps("crop")} placeholder="e.g. paddy" required /></Field>
          <Field name="season" label="Crop season *" error={errors.season}><select {...fieldProps("season")} defaultValue="" required><option value="" disabled>Select a season</option>{seasons.map((season) => <option key={season} value={season}>{displayName(season)}</option>)}</select></Field>
          <Field name="season_year" label="Season year *" error={errors.season_year}><input {...fieldProps("season_year")} type="number" min={2000} max={2100} step={1} defaultValue={new Date().getFullYear()} required /></Field>
          <Field name="peril" label="Damage type *" error={errors.peril}><select {...fieldProps("peril")} defaultValue="" required><option value="" disabled>Select damage type</option>{perils.map((peril) => <option key={peril} value={peril}>{displayName(peril)}</option>)}</select></Field>
          <Field name="event_date" label="Date of incident *" error={errors.event_date}><input {...fieldProps("event_date")} type="date" required /></Field>
        </div><div className="kc-field form-description"><label htmlFor="description">What happened? <span>(optional)</span></label><textarea {...fieldProps("description")} rows={4} maxLength={2000} placeholder="Describe what you observed in your field…" /><small>Up to 2,000 characters.</small>{errors.description && <span className="kc-field-error" id="description-error">{errors.description}</span>}</div></section>
        <section className="kc-card form-section"><div className="form-section-title"><span>03</span><div><h2>Field location <small>Optional</small></h2><p>Add both coordinates if you know your field’s location.</p></div><MapPin size={21} /></div><div className="kc-field-grid"><Field name="latitude" label="Latitude" error={errors.latitude}><input {...fieldProps("latitude")} type="number" min={-90} max={90} step="any" placeholder="e.g. 30.9000" /></Field><Field name="longitude" label="Longitude" error={errors.longitude}><input {...fieldProps("longitude")} type="number" min={-180} max={180} step="any" placeholder="e.g. 75.8500" /></Field></div></section>
        <section className="kc-card form-section"><div className="form-section-title"><span>04</span><div><h2>Photographs of the damage</h2><p>Add 1–5 JPEG, PNG or WebP photos, up to 5 MiB each.</p></div><Camera size={21} /></div>
          <input ref={fileRef} id="photos" type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" tabIndex={-1} aria-label="Choose crop damage photos" onChange={(event) => { photoSelection(event.target.files); event.target.value = ""; }} />
          <button type="button" className="photo-picker" onClick={() => fileRef.current?.click()} disabled={photos.length >= 5}><span className="kc-icon-tile"><ImagePlus size={25} strokeWidth={1.5} /></span><strong>{photos.length >= 5 ? "All 5 photos added" : "Choose crop photographs"}</strong><span>Show the affected crop and surrounding field.</span></button>
          {(photoNotice || errors.photos) && <p role="alert" className="kc-field-error">{photoNotice || errors.photos}</p>}
          {!!photos.length && <div className="photo-previews">{photos.map((file, index) => <div className="photo-preview" key={`${file.name}-${index}`}>{previews[index] && <img src={previews[index]} alt={`Selected crop photo ${index + 1}`} />}<button type="button" aria-label={`Remove ${file.name}`} onClick={() => setPhotos(photos.filter((_, i) => i !== index))}><X size={14} /></button><span title={file.name}>{file.name}</span></div>)}</div>}
        </section>
      </fieldset>
      {error && <div className="kc-alert kc-alert-error" role="alert"><p>{error}</p>{savedId && <Link className="kc-text-link" href={`/farmer/claims/${savedId}`}>View saved claim <ArrowRight size={14} /></Link>}</div>}
      {locked && !busy && <div className="kc-alert">This submission may already be saved. Retry sends exactly the same details and photos to avoid a duplicate claim.{savedId && " You can also open the saved claim above."}</div>}
      <div className="form-submit-row"><p><ShieldCheck size={16} /> Your policy is checked before evidence analysis.</p><button type="submit" className="kc-button" disabled={busy}>{busy ? "Saving your claim…" : locked ? "Retry same submission" : "Submit claim"}<ArrowRight size={17} /></button></div>
    </form><aside className="claim-form-aside"><div className="kc-card form-help"><span className="kc-icon-tile"><Leaf size={24} strokeWidth={1.4} /></span><h3>A little preparation.<br /><em>A smoother journey.</em></h3><ul><li><Check size={16} /> Keep your demo policy details handy.</li><li><Check size={16} /> Check the incident date and crop season.</li><li><Check size={16} /> Choose clear photos of the affected crop.</li></ul><hr /><h4>What happens next?</h4><p>We save your claim, upload the photos, and queue a policy check. You can follow its progress from My claims.</p></div><div className="form-demo-note"><ShieldCheck size={19} /><p>This MVP uses fictional farmer identities and synthetic policies. Final insurance decisions and payouts are outside this demo.</p></div></aside></div>
  </>;
}
