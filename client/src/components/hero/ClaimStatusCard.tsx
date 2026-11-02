"use client";

import { motion } from "motion/react";
import { ShieldCheck, CheckCircle2, Clock, FileCheck } from "lucide-react";

/**
 * Floating glass-morphism card that shows a demo claim status.
 * Positioned over the hero image on large screens.
 */
export default function ClaimStatusCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.9,
        delay: 1.8,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="hidden lg:block absolute -bottom-6 right-8 xl:right-12 z-20"
    >
      <motion.div
        animate={{ y: [0, -5, 0] }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="w-[260px]
                   bg-white/80 backdrop-blur-xl
                   border border-black/[0.06]
                   rounded-xl
                   shadow-[0_4px_24px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]
                   overflow-hidden"
      >
        {/* Header */}
        <div className="px-4 pt-4 pb-2.5 border-b border-black/[0.04]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-md bg-[#1A3A2A]/[0.06]">
                <FileCheck size={12} className="text-[#1A3A2A]" />
              </span>
              <div>
                <p className="text-[9px] text-[#1A3A2A]/35 font-medium tracking-wider uppercase">
                  Demo Claim
                </p>
                <p className="text-[12px] text-[#1A3A2A] font-semibold leading-tight">
                  #KC-2026-0847
                </p>
              </div>
            </div>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#D99A48]/10 text-[#D99A48] text-[9px] font-semibold">
              <Clock size={8} />
              In Review
            </span>
          </div>
        </div>

        {/* Status Items */}
        <div className="px-4 py-3 space-y-2.5">
          <div className="flex items-center gap-2.5">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#1A3A2A]/[0.06]">
              <ShieldCheck size={10} className="text-[#1A3A2A]" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[10.5px] text-[#1A3A2A]/75 font-medium">
                Insurance Verified
              </p>
            </div>
            <CheckCircle2
              size={13}
              className="text-[#1A3A2A]/60 fill-[#1A3A2A]/[0.06] flex-shrink-0"
            />
          </div>

          <div className="flex items-center gap-2.5">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#1A3A2A]/[0.06]">
              <FileCheck size={10} className="text-[#1A3A2A]" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[10.5px] text-[#1A3A2A]/75 font-medium">
                Evidence Collected
              </p>
            </div>
            <CheckCircle2
              size={13}
              className="text-[#1A3A2A]/60 fill-[#1A3A2A]/[0.06] flex-shrink-0"
            />
          </div>

          <div className="flex items-center gap-2.5">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#D99A48]/10">
              <Clock size={10} className="text-[#D99A48]" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[10.5px] text-[#1A3A2A]/75 font-medium">
                Officer Review
              </p>
            </div>
            <div className="w-3 h-3 rounded-full border-[1.5px] border-[#D99A48]/30 flex-shrink-0" />
          </div>
        </div>

        {/* Progress */}
        <div className="px-4 pb-3.5">
          <div className="h-1 bg-[#1A3A2A]/[0.06] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "67%" }}
              transition={{
                duration: 1.2,
                delay: 2.4,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="h-full bg-[#1A3A2A]/60 rounded-full"
            />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
