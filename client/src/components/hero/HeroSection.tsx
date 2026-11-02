"use client";

import Image from "next/image";
import HeroNavbar from "./HeroNavbar";
import HeroBadge from "./HeroBadge";
import HeroContent from "./HeroContent";
import DashboardPreview from "./DashboardPreview";

/**
 * Hero Section — Kisaan Chakshu
 *
 * Designed with:
 * - Full Indian farming illustration background (crisp, preserving authentic colors & artwork)
 * - Symmetrical subtle radial scrim over the sky area so centered typography is razor-sharp
 * - Cinematic slow blur-in text animation, line by line
 * - Editorial serif typography (Instrument Serif)
 * - CloudNexus-inspired fake dashboard showcase with interactive callout pills
 * - Floating glassmorphism navbar
 */
export default function HeroSection() {
  return (
    <section
      className="relative w-full min-h-screen overflow-hidden bg-[#FAF3E5]"
      aria-labelledby="hero-heading"
    >
      {/* ── Background Illustration (Preserving original colors and artwork) ── */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <Image
          src="/images/hero-bg.jpg"
          alt="Indian farming illustration showing farmers, lush crops, canal, and rural Bharat"
          fill
          priority
          quality={95}
          sizes="100vw"
          className="object-cover object-top sm:object-center select-none"
        />

        {/* ── Symmetrical Warm Cream Scrim ── */}
        {/* Soft radial scrim concentrated in the center sky to make text pop while keeping edges crisp */}
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_25%,_rgba(250,243,229,0.72)_0%,_rgba(250,243,229,0.45)_45%,_rgba(250,243,229,0.15)_75%,_transparent_100%)]"
        />

        {/* Symmetrical soft horizontal edge fade */}
        <div
          className="absolute inset-0 bg-gradient-to-r from-[#FAF3E5]/25 via-transparent to-[#FAF3E5]/25"
        />

        {/* Soft top gradient under floating navbar */}
        <div
          className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-b from-[#FAF3E5]/60 via-[#FAF3E5]/20 to-transparent"
        />

        {/* Bottom fade blending smoothly into the page */}
        <div
          className="absolute bottom-0 left-0 right-0 h-44 bg-gradient-to-t from-[#FAF3E5] via-[#FAF3E5]/60 to-transparent"
        />
      </div>

      {/* ── Floating Navbar ── */}
      <HeroNavbar />

      {/* ── Main Content Container ── */}
      <div className="relative z-10 pt-28 sm:pt-32 md:pt-36 pb-16 sm:pb-24">
        {/* Centered Hero Header Stack */}
        <div className="mx-auto max-w-[880px] px-5 sm:px-8">
          <HeroBadge />
          <HeroContent />
        </div>

        {/* CloudNexus-style Dashboard Preview */}
        <div className="relative">
          <DashboardPreview />
        </div>
      </div>
    </section>
  );
}
