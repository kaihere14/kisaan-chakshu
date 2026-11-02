"use client";

import { useState } from "react";
import { ArrowDown, ArrowRight, ArrowUpRight, Check, ChevronDown, CloudRain, Eye, FileCheck2, FileText, Fingerprint, Leaf, Menu, ScanLine, ShieldCheck, Sprout, Sun, Users, Wheat, X } from "lucide-react";

const witnesses = [
  { name: "Ground", subtitle: "What the crop shows", icon: Sprout, title: "Every photograph tells part of the story.", text: "Image observations help an officer understand visible crop damage and whether a photograph is suitable for assessment.", checks: ["Visible damage observations", "Photo suitability checks", "Consistency with reported damage"], label: "CROP OBSERVATIONS", result: "A closer look at the ground", detail: "Photo evidence adds context to the farmer’s account. Findings remain provisional.", className: "ground" },
  { name: "Sky", subtitle: "What the weather says", icon: CloudRain, title: "Put the incident in its weather context.", text: "Weather records help reviewers compare the reported incident with conditions around the claimed location and date.", checks: ["Location and date context", "Weather corroboration", "Conflicting evidence kept visible"], label: "WEATHER CONTEXT", result: "Another view of the same event", detail: "Weather can support an account. It cannot establish damage to an individual plot.", className: "sky" },
  { name: "Device", subtitle: "What the details reveal", icon: Fingerprint, title: "Small details deserve a careful look.", text: "Available location, time, and duplicate-image signals provide supporting context, with missing information clearly flagged.", checks: ["Available location and timestamps", "Duplicate-image signals", "Explicit missing-data warnings"], label: "SUPPORTING SIGNALS", result: "Context, with its limits intact", detail: "Device signals support review. They are not tamperproof evidence or a final verdict.", className: "device" },
];

const faqs = [
  { question: "What is Kisaan Chakshu?", answer: "Kisaan Chakshu is an AI-assisted crop insurance claim screening and prioritization MVP. The planned workflow brings policy checks, photo observations, weather evidence, and device signals into an explainable report for an officer to review." },
  { question: "Does AI approve or reject an insurance claim?", answer: "No. The assessment is provisional and intended to help officers prioritize and review claims. Final insurance decisions, compensation calculations, and payouts are outside this MVP." },
  { question: "Why does policy verification come first?", answer: "The planned workflow checks whether the submitted details match the policy and reported event before running evidence analysis. A mismatch is routed for correction or manual verification, with the reason made visible." },
  { question: "What happens when evidence is missing?", answer: "Missing, unavailable, or contradictory evidence is meant to stay visible in the report. The claim remains available for human review, with officers able to request more evidence or a field survey." },
  { question: "Can I submit a real claim here?", answer: "This is the project’s introductory landing page. Claim submission and officer tools are planned and are not connected here. The MVP is intended to use fictional farmer identities and synthetic insurance records for demonstration." },
];

function Brand({ light = false }: { light?: boolean }) {
  return <a className={`brand${light ? " brand-light" : ""}`} href="#home" aria-label="Kisaan Chakshu home"><span className="brand-icon"><Eye size={26} strokeWidth={1.6} /><Leaf className="brand-leaf" size={14} /></span><span>Kisaan<span className="brand-second">Chakshu</span></span></a>;
}

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [witness, setWitness] = useState(0);
  const current = witnesses[witness];
  const CurrentIcon = current.icon;

  return <>
    <a href="#main" className="skip-link">Skip to content</a>
    <header className="site-header" id="home">
      <div className="nav-wrap">
        <Brand />
        <nav className="desktop-nav" aria-label="Main navigation"><a href="#how-it-works">How it works</a><a href="#evidence">The three witnesses</a><a href="#questions">FAQs</a></nav>
        <a className="button button-small nav-cta" href="#built-for-you">Explore the platform <ArrowUpRight size={15} /></a>
        <button className="menu-toggle" aria-label={menuOpen ? "Close navigation" : "Open navigation"} aria-expanded={menuOpen} aria-controls="mobile-navigation" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button>
      </div>
      {menuOpen && <nav id="mobile-navigation" className="mobile-nav" aria-label="Mobile navigation">{[["How it works", "how-it-works"], ["The three witnesses", "evidence"], ["Built for you", "built-for-you"], ["FAQs", "questions"]].map(([name, id]) => <a key={id} href={`#${id}`} onClick={() => setMenuOpen(false)}>{name}<ArrowUpRight size={16} /></a>)}</nav>}
    </header>

    <main id="main">
      <section className="hero" aria-labelledby="hero-heading">
        <div className="hero-copy">
          <a className="eyebrow-pill" href="#how-it-works"><span className="live-dot" /> Rooted in care. Guided by evidence. <ArrowUpRight size={13} /></a>
          <h1 id="hero-heading">For every harvest,<br />a little more <em>certainty.</em></h1>
          <p>A clearer path from crop damage to claim review.<br className="desktop-break" /> Bringing farmers, evidence, and human judgment together.</p>
          <div className="hero-actions"><a className="button" href="#for-farmers">For farmers <ArrowUpRight size={17} /></a><a className="button button-outline" href="#for-officers">For insurance officers <ArrowRight size={17} /></a></div>
          <div className="hero-note"><ShieldCheck size={14} /> AI-assisted screening. Human-led decisions.</div>
        </div>
        <div className="landscape" role="img" aria-label="Illustration of golden fields, green hills, a farmhouse, and a farmer beneath the morning sun" />
        <div className="landscape-caption"><span><Sun size={15} /> A new perspective on crop care</span><a href="#how-it-works" aria-label="Scroll to how it works"><ArrowDown size={17} /></a><span className="caption-right">BUILT FOR BHARAT <span className="small-star">✳</span></span></div>
      </section>

      <div className="principles" aria-label="Our approach"><div><Leaf /> Rooted in agriculture</div><span className="principle-divider" /><div><ScanLine /> Evidence in context</div><span className="principle-divider" /><div><Users /> People at the heart</div><span className="principle-divider" /><div><FileCheck2 /> Clarity at every step</div></div>

      <section className="section workflow" id="how-it-works" aria-labelledby="workflow-heading">
        <div className="section-heading"><div><span className="overline"><span /> FROM FIELD TO REVIEW</span><h2 id="workflow-heading">Less uncertainty.<br /><em>A clearer way forward.</em></h2></div><p>When a harvest is affected, the next step should feel simpler. Here’s the journey we’re building.</p></div>
        <div className="workflow-grid">
          {[
            { icon: FileText, title: "Share the story", text: "A farmer submits crop damage details, policy information, and photo evidence." },
            { icon: ShieldCheck, title: "Check the coverage", text: "Policy and incident details are checked first. Mismatches get a clear path to correction." },
            { icon: ScanLine, title: "Bring evidence together", text: "Ground, Sky, and Device checks add independent context to eligible claims." },
            { icon: Users, title: "Support human review", text: "An explainable report helps officers prioritize claims and decide what needs a closer look." },
          ].map((step, i) => <article className="workflow-step" key={step.title}><div className="step-top"><span className="step-icon"><step.icon size={23} strokeWidth={1.5} /></span><span className="step-number">0{i + 1}</span></div><h3>{step.title}</h3><p>{step.text}</p>{i < 3 && <ArrowRight className="step-arrow" size={18} />}</article>)}
        </div>
        <div className="workflow-footnote"><span className="tiny-star">✳</span> A thoughtful sequence: policy verification before evidence processing.</div>
      </section>

      <section className="evidence-section" id="evidence" aria-labelledby="evidence-heading"><div className="section">
        <div className="center-heading"><span className="overline"><span /> THE THREE WITNESSES</span><h2 id="evidence-heading">One claim. <em>A fuller picture.</em></h2><p>No single signal tells the whole story. Three independent perspectives<br className="desktop-break" /> help make the evidence easier to understand.</p></div>
        <div className="witness-tabs" role="tablist" aria-label="Evidence perspectives">{witnesses.map((item, i) => <button key={item.name} id={`tab-${i}`} role="tab" aria-selected={witness === i} aria-controls={`panel-${i}`} tabIndex={witness === i ? 0 : -1} onClick={() => setWitness(i)} onKeyDown={event => { const next = event.key === "ArrowRight" ? (i + 1) % 3 : event.key === "ArrowLeft" ? (i + 2) % 3 : event.key === "Home" ? 0 : event.key === "End" ? 2 : null; if (next !== null) { event.preventDefault(); setWitness(next); document.getElementById(`tab-${next}`)?.focus(); } }}><item.icon size={20} strokeWidth={1.6} /><span><strong>{item.name}</strong><small>{item.subtitle}</small></span><span className="tab-index">0{i + 1}</span></button>)}</div>
        <div className="witness-panel" id={`panel-${witness}`} role="tabpanel" aria-labelledby={`tab-${witness}`} tabIndex={0}>
          <div className={`evidence-visual ${current.className}`}><span className="visual-label"><span className="live-dot" /> ILLUSTRATIVE PREVIEW</span><div className="scan-corners"><div className="scan-cross" /><CurrentIcon className="evidence-main-icon" strokeWidth={.8} /><span className="scan-marker marker-one" /><span className="scan-marker marker-two" /></div><div className="evidence-summary"><span className="summary-icon"><CurrentIcon size={22} /></span><div><small>{current.label}</small><strong>{current.result}</strong></div><ArrowUpRight size={18} /></div><div className="visual-coordinates">GROUND / SKY / DEVICE <span>CONTEXT MATTERS</span></div></div>
          <div className="witness-copy"><span className="overline">{current.name.toUpperCase()} EVIDENCE</span><h3>{current.title}</h3><p>{current.text}</p><ul>{current.checks.map(check => <li key={check}><span><Check size={12} /></span>{check}</li>)}</ul><div className="evidence-limit"><ShieldCheck size={17} /><p>{current.detail}</p></div></div>
        </div>
      </div></section>

      <section className="section audiences" id="built-for-you" aria-labelledby="audiences-heading"><div className="section-heading"><div><span className="overline"><span /> TWO SIDES. ONE SHARED PURPOSE.</span><h2 id="audiences-heading">Built around <em>people.</em></h2></div><p>More clarity for the person making a claim.<br />Better context for the person reviewing it.</p></div>
        <div className="audience-grid"><article className="audience-card farmer-card" id="for-farmers"><div className="audience-top"><span className="audience-icon"><Wheat size={28} strokeWidth={1.4} /></span><span className="planned-label">PLANNED FARMER PORTAL</span></div><span className="overline">FOR THE HANDS THAT FEED US</span><h3>Your claim.<br />A clearer journey.</h3><p>Share what happened, understand what’s needed, and follow your claim through review.</p><ul><li><Check size={15} /> Submit details and crop photographs</li><li><Check size={15} /> See policy mismatches and make corrections</li><li><Check size={15} /> Follow claim status and requests</li></ul><a href="#how-it-works">Explore the claim journey <ArrowUpRight size={18} /></a><Sprout className="audience-decoration" strokeWidth={.7} /></article>
        <article className="audience-card officer-card" id="for-officers"><div className="audience-top"><span className="audience-icon"><FileCheck2 size={28} strokeWidth={1.4} /></span><span className="planned-label">PLANNED OFFICER WORKSPACE</span></div><span className="overline">FOR THE PEOPLE BEHIND THE DECISIONS</span><h3>The context you need.<br />The judgment you bring.</h3><p>Review an organized queue with the evidence, reasoning, and uncertainties in one place.</p><ul><li><Check size={15} /> Review policy exceptions and claim priorities</li><li><Check size={15} /> Understand evidence and missing information</li><li><Check size={15} /> Request more evidence or a field survey</li></ul><a href="#evidence">Explore the evidence approach <ArrowUpRight size={18} /></a><ShieldCheck className="audience-decoration" strokeWidth={.7} /></article></div>
      </section>

      <section className="human-strip"><span className="human-symbol"><Users size={27} strokeWidth={1.4} /></span><div><h3>Technology brings the evidence.<br className="mobile-break" /> People make the decisions.</h3><p>Every assessment is provisional. Final insurance decisions stay with human reviewers.</p></div><span className="human-seal"><ShieldCheck size={16} /> HUMAN-LED BY DESIGN</span></section>

      <section className="section faq-section" id="questions" aria-labelledby="faq-heading"><div className="faq-intro"><span className="overline"><span /> A LITTLE MORE CLARITY</span><h2 id="faq-heading">Good questions.<br /><em>Clear answers.</em></h2><p>Getting to know Kisaan Chakshu.</p><span className="faq-flower" aria-hidden="true">✳</span></div><div className="faq-list">{faqs.map((faq, i) => <details key={faq.question} className="faq-item"><summary><span className="faq-number">0{i + 1}</span><span>{faq.question}</span><ChevronDown size={18} /></summary><p>{faq.answer}</p></details>)}</div></section>

      <section className="closing"><div className="closing-ornament" aria-hidden="true">✳</div><span className="overline">ROOTED IN BHARAT. BUILT WITH PURPOSE.</span><h2>Because behind every claim,<br />there’s <em>a season of hard work.</em></h2><p>Making that story easier to share, understand, and review.</p><a className="button" href="#how-it-works">Discover the journey <ArrowUpRight size={17} /></a><div className="closing-lines" aria-hidden="true" /></section>
    </main>
    <footer className="site-footer"><div className="footer-top"><div><Brand /><p>A clearer perspective.<br />For every farmer. For every claim.</p></div><div className="footer-links"><a href="#how-it-works">How it works</a><a href="#evidence">Our approach</a><a href="#questions">FAQs</a><a href="#home">Back to top ↑</a></div></div><div className="footer-bottom"><span>© {new Date().getFullYear()} Kisaan Chakshu</span><span>Team 4 UNKNOWNS <span className="footer-dot">·</span> Build for Bharat 2026</span><span className="demo-label"><span className="live-dot" /> MVP concept · Synthetic data only</span></div></footer>
  </>;
}
