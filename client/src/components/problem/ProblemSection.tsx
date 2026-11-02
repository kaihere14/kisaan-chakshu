"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import PaperStackIllustration from "./PaperStackIllustration";
import ProblemCardList, { PROBLEMS_DATA } from "./ProblemCardList";

/**
 * ProblemSection — Kisaan Chakshu
 *
 * Demonstrates the core bottleneck:
 * Manual work takes time -> Papers pile up -> Files get missed -> Relief delayed.
 * Color theme: #FAF3E5 cream, #1B3B28 forest green, #B65A35 terracotta.
 */
export default function ProblemSection() {
  const [activeProblemIndex, setActiveProblemIndex] = useState(0);
  const [isAutoCycling, setIsAutoCycling] = useState(true);

  // Auto-cycle through the problems one by one
  useEffect(() => {
    if (!isAutoCycling) return;

    const interval = setInterval(() => {
      setActiveProblemIndex((prev) => (prev + 1) % PROBLEMS_DATA.length);
    }, 5500);

    return () => clearInterval(interval);
  }, [isAutoCycling]);

  const handleSelectProblem = (index: number) => {
    setActiveProblemIndex(index);
    setIsAutoCycling(false); // pause auto-cycle when user manually clicks
  };

  return (
    <section
      id="problem"
      className="relative w-full py-16 sm:py-20 md:py-24 bg-[#FAF3E5] overflow-hidden border-t border-[#1B3B28]/8"
      aria-labelledby="problem-heading"
    >
      {/* ── Soft decorative background gradients ── */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-[#B65A35]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-[450px] h-[450px] bg-[#D99A48]/8 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-[1240px] mx-auto px-5 sm:px-8 lg:px-12">
        {/* ── Section Header Stack: Two-Word Heading & Two-Word Subheading ── */}
        <div className="flex flex-col items-center text-center max-w-[600px] mx-auto mb-10 sm:mb-14">
          <motion.h2
            id="problem-heading"
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="font-serif text-[clamp(40px,5.8vw,64px)] font-normal leading-[1.08] tracking-[-0.02em] text-[#1B3B28]"
          >
            The Problem,
            <span className="block text-[#B65A35] italic">
              Piled Up.
            </span>
          </motion.h2>
        </div>

        {/* ── Main Two-Column Content Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* Left Column: Sequential Problem Cards (7 cols on lg) */}
          <div className="lg:col-span-6 xl:col-span-7">
            <div className="mb-4 flex items-center justify-between text-xs font-semibold text-[#1B3B28]/60 uppercase tracking-wider">
              <span>The Bottleneck</span>
              <span className="font-mono">
                {activeProblemIndex + 1} of {PROBLEMS_DATA.length}
              </span>
            </div>

            <ProblemCardList
              activeIndex={activeProblemIndex}
              onSelectIndex={handleSelectProblem}
            />
          </div>

          {/* Right Column: Animated Paper Stack Illustration (5 cols on lg) */}
          <div className="lg:col-span-6 xl:col-span-5 lg:sticky lg:top-28">
            <div className="mb-4 flex items-center justify-between text-xs font-semibold text-[#1B3B28]/60 uppercase tracking-wider">
              <span>Paper Backlog</span>
              <span className="text-[#B65A35] font-semibold">Live Simulation</span>
            </div>

            <PaperStackIllustration
              activeProblemIndex={activeProblemIndex}
              onSelectProblem={handleSelectProblem}
            />

            {/* Micro stats banner beneath illustration */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="bg-white/70 backdrop-blur-sm p-3.5 rounded-2xl border border-[#1B3B28]/10 text-center">
                <span className="block text-[22px] sm:text-[24px] font-bold font-serif text-[#B65A35]">
                  45–90
                </span>
                <span className="block text-[11.5px] text-[#1B3B28]/70 font-medium leading-tight mt-0.5">
                  Days average manual wait
                </span>
              </div>

              <div className="bg-white/70 backdrop-blur-sm p-3.5 rounded-2xl border border-[#1B3B28]/10 text-center">
                <span className="block text-[22px] sm:text-[24px] font-bold font-serif text-[#1B3B28]">
                  0 / 100
                </span>
                <span className="block text-[11.5px] text-[#1B3B28]/70 font-medium leading-tight mt-0.5">
                  Automated triage score
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
