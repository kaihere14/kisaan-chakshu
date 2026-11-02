"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Eye, EyeOff, Leaf, ShieldCheck, Sprout } from "lucide-react";
import { getCurrentUser, login, signup, workspaceFor } from "@/services/auth.service";
import { ApiError } from "@/services/api";

export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const isSignup = mode === "signup";
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    getCurrentUser().then(({ user }) => { if (active) router.replace(workspaceFor(user)); }).catch(() => {});
    return () => { active = false; };
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const data = new FormData(event.currentTarget);
    setBusy(true); setError("");
    try {
      const email = String(data.get("email")).trim();
      const password = String(data.get("password"));
      const { user } = isSignup ? await signup(String(data.get("name")).trim(), email, password) : await login(email, password);
      router.replace(workspaceFor(user));
    } catch (error) {
      setError(error instanceof ApiError && error.fields.length ? error.fields.map((field) => field.message).join(" ") : error instanceof Error ? error.message : "Unable to sign in.");
      setBusy(false);
    }
  }

  return <main className="auth-page">
    <aside className="auth-story">
      <Link href="/" className="kc-brand"><span className="kc-brand-mark"><Eye size={23} /><Leaf size={11} /></span>Kisaan<span>Chakshu</span></Link>
      <div className="auth-story-copy"><span className="kc-eyebrow">ROOTED IN CARE</span><h1>A season of hard work.<br /><em>A clearer way forward.</em></h1><p>Your crop, your story, your claim. Keep everything together in one place.</p><div className="auth-story-note"><ShieldCheck size={20} /><span>AI-assisted screening.<br />Human-led decisions.</span></div></div>
      <span className="auth-caption">BUILT FOR BHARAT · SYNTHETIC DATA DEMO</span>
    </aside>
    <section className="auth-form-panel">
      <Link href="/" className="kc-back"><ArrowLeft size={15} /> Back to home</Link>
      <div className="auth-form-wrap"><span className="kc-icon-tile"><Sprout size={25} strokeWidth={1.5} /></span><span className="kc-eyebrow">YOUR KISAAN CHAKSHU ACCOUNT</span><h2>{isSignup ? "Let’s get you growing." : "Welcome back."}</h2><p className="kc-muted">{isSignup ? "Create your farmer account to submit and follow your claims." : "Sign in to pick up where you left off."}</p>
        <form onSubmit={handleSubmit} className="auth-form">
          {isSignup && <div className="kc-field"><label htmlFor="name">Full name</label><input id="name" name="name" autoComplete="name" placeholder="Your full name" required maxLength={100} /></div>}
          <div className="kc-field"><label htmlFor="email">Email address</label><input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required maxLength={254} /></div>
          <div className="kc-field"><label htmlFor="password">Password</label><div className="kc-password"><input id="password" name="password" type={visible ? "text" : "password"} autoComplete={isSignup ? "new-password" : "current-password"} minLength={isSignup ? 12 : 1} maxLength={128} placeholder={isSignup ? "At least 12 characters" : "Enter your password"} required aria-describedby={isSignup ? "password-hint" : undefined} /><button type="button" onClick={() => setVisible(!visible)} aria-label={visible ? "Hide password" : "Show password"}>{visible ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>{isSignup && <small id="password-hint">Use 12–128 characters. Spaces and passphrases are welcome.</small>}</div>
          {error && <div className="kc-alert kc-alert-error" role="alert">{error}</div>}
          <button className="kc-button auth-submit" type="submit" disabled={busy}>{busy ? "Please wait…" : isSignup ? "Create farmer account" : "Sign in"}<ArrowRight size={17} /></button>
        </form>
        <p className="auth-switch">{isSignup ? "Already have an account?" : "New to Kisaan Chakshu?"} <Link href={isSignup ? "/login" : "/signup"}>{isSignup ? "Sign in" : "Create an account"}</Link></p>
        <div className="auth-footnote"><ShieldCheck size={16} /><p>{isSignup ? "Public signup is for farmers. Officer accounts are created by the project operator." : "Farmers and officers sign in here. Your account opens the appropriate workspace."}</p></div>
      </div>
      <p className="auth-bottom">A clearer perspective. For every farmer. For every claim.</p>
    </section>
  </main>;
}
