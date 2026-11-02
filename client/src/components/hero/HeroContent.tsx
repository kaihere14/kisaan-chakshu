"use client";

import { motion } from "motion/react";
import { ArrowRight, ChevronRight } from "lucide-react";
import Link from "next/link";

const ROUTES = {
  startClaim: "/claims/new",
  exploreProcess: "/#how-it-works",
} as const;

const smoothEasing = [0.16, 1, 0.3, 1] as const;

/**
 * Blur-in animation transition:
 * Starts blurred + transparent + offset down, then resolves to crystalline clarity.
 */
const blurIn = (delay: number, duration: number = 0.95) => ({
  initial: { opacity: 0, y: 18, filter: "blur(14px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  transition: {
    duration,
    delay,
    ease: smoothEasing,
  },
});

export default function HeroContent() {
  return (
    <div className="flex flex-col items-center text-center max-w-[840px] mx-auto">
      {/* ── Main Heading — line-by-line blur-in ── */}
      <h1 id="hero-heading" className="mt-5 sm:mt-7 font-serif">
        {/* Line 1: Har Fasal Ka Bharosa */}
        <motion.span
          {...blurIn(0.32, 1.0)}
          className="block text-[clamp(40px,6.2vw,76px)] font-normal
                     leading-[1.08] tracking-[-0.03em] text-[#1B3B28]"
        >
          Har Fasal Ka Bharosa,
        </motion.span>

        {/* Line 2: हर किसान के साथ (in Hindi, warm terracotta/gold) */}
        <motion.span
          {...blurIn(0.55, 1.0)}
          className="block text-[clamp(36px,5.8vw,72px)] font-normal
                     leading-[1.12] tracking-[-0.02em] mt-1 sm:mt-2 text-[#B65A35] italic"
        >
          हर किसान के साथ।
        </motion.span>
      </h1>

      {/* ── Description — separate blur-in ── */}
      <motion.p
        {...blurIn(0.78, 0.9)}
        className="mt-5 sm:mt-6 max-w-[540px] text-[15px] sm:text-[16.5px]
                   leading-[1.75] text-[#1B3B28]/70 font-normal"
      >
        Simplifying crop-loss claims with intelligent verification,
        evidence-based assessment, and transparent officer review.
      </motion.p>

      {/* ── CTA Buttons — separate blur-in ── */}
      <motion.div
        {...blurIn(0.98, 0.85)}
        className="mt-7 sm:mt-9 flex flex-col sm:flex-row items-center gap-3 sm:gap-4"
      >
        {/* Primary CTA */}
        <Link
          href={ROUTES.startClaim}
          className="group inline-flex items-center gap-2.5 px-7 py-3.5
                     bg-[#1B3B28] text-[#FAF3E5]
                     text-[13.5px] sm:text-[14px] font-semibold
                     rounded-full
                     shadow-[0_2px_8px_rgba(27,59,40,0.18),0_8px_24px_rgba(27,59,40,0.12)]
                     hover:shadow-[0_4px_12px_rgba(27,59,40,0.25),0_12px_32px_rgba(27,59,40,0.2)]
                     hover:bg-[#142C1E]
                     active:scale-[0.98]
                     transition-all duration-300"
        >
          Start Your Claim
          <ArrowRight
            size={15}
            strokeWidth={2}
            className="group-hover:translate-x-0.5 transition-transform duration-300"
          />
        </Link>

        {/* Secondary CTA */}
        <Link
          href={ROUTES.exploreProcess}
          className="group inline-flex items-center gap-2 px-6 py-3.5
                     text-[#1B3B28] hover:text-[#1B3B28]
                     text-[13.5px] sm:text-[14px] font-medium
                     bg-[#FAF3E5]/80 hover:bg-[#FAF3E5]
                     border border-[#1B3B28]/15 hover:border-[#1B3B28]/30
                     rounded-full backdrop-blur-sm
                     active:scale-[0.98]
                     transition-all duration-300"
        >
          Explore the Process
          <ChevronRight
            size={14}
            strokeWidth={1.8}
            className="text-[#1B3B28]/40 group-hover:text-[#1B3B28]/80
                       group-hover:translate-x-0.5 transition-all duration-300"
          />
        </Link>
      </motion.div>

      {/* ── Subtitle / Guarantee note — subtle blur-in ── */}
      <motion.p
        {...blurIn(1.18, 0.8)}
        className="mt-4 sm:mt-5 text-[11.5px] text-[#1B3B28]/45 font-medium tracking-wide"
      >
        Built for Bharat · AI-assisted screening · Human-led decisions
      </motion.p>
    </div>
  );
}
