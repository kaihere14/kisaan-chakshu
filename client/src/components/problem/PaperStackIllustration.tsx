"use client";

import { motion, AnimatePresence } from "motion/react";
import {
  FileText,
  AlertCircle,
  Clock,
  Search,
  FileQuestion,
  Calendar,
  Layers,
  Sparkles,
} from "lucide-react";

interface PaperStackIllustrationProps {
  activeProblemIndex: number;
  onSelectProblem?: (index: number) => void;
}

/**
 * Custom illustration representing an officer's desk with an overflowing,
 * precarious paper pile, misplaced files slipping out, and animated documents.
 */
export default function PaperStackIllustration({
  activeProblemIndex,
  onSelectProblem,
}: PaperStackIllustrationProps) {
  return (
    <div className="relative w-full max-w-[540px] mx-auto select-none">
      {/* ── Soft Ambient Glow & Shadow Behind Illustration ── */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#B65A35]/10 via-[#D99A48]/15 to-transparent blur-3xl -z-10 rounded-full scale-95" />

      {/* ── Outer Illustration Canvas ── */}
      <div
        className="relative bg-gradient-to-b from-[#FDFBF7] to-[#F5EBD7]
                   rounded-3xl border border-[#1B3B28]/12
                   p-5 sm:p-7 md:p-8
                   shadow-[0_4px_20px_rgba(27,59,40,0.06),0_16px_40px_rgba(27,59,40,0.08)]
                   overflow-hidden"
      >
        {/* Subtle grid texture overlay */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(#1B3B28 1px, transparent 1px), radial-gradient(#1B3B28 1px, #FDFBF7 1px)",
            backgroundSize: "20px 20px",
          }}
        />

        {/* ── Header of the Illustration: Mock Office Desk Banner ── */}
        <div className="relative z-10 flex items-center justify-between border-b border-[#1B3B28]/10 pb-3 mb-6">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#B65A35] animate-pulse" />
            <span className="text-[11px] sm:text-[12px] font-semibold tracking-wider uppercase text-[#1B3B28]/70">
              Taluk Tehsil Office · Physical Inward Desk
            </span>
          </div>

          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-medium bg-[#B65A35]/10 text-[#B65A35] border border-[#B65A35]/20">
            <AlertCircle size={12} strokeWidth={2} />
            Queue Overflowing
          </span>
        </div>

        {/* ── Main Illustration Stage ── */}
        <div className="relative h-[380px] sm:h-[420px] flex flex-col justify-end items-center">
          {/* Floating/Falling Document Animation (signaling non-stop manual influx) */}
          <motion.div
            key={`falling-doc-${activeProblemIndex}`}
            initial={{ y: -60, opacity: 0, rotate: -8, scale: 0.9 }}
            animate={{
              y: [0, 8, 0],
              opacity: 1,
              rotate: activeProblemIndex % 2 === 0 ? 5 : -4,
              scale: 1,
            }}
            transition={{
              y: { repeat: Infinity, duration: 3.5, ease: "easeInOut" },
              default: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
            }}
            className="absolute top-2 sm:top-4 z-30 flex items-center gap-2.5 px-3.5 py-2.5
                       bg-white/95 rounded-xl border border-[#B65A35]/30
                       shadow-[0_8px_20px_rgba(182,90,53,0.18)]
                       backdrop-blur-sm cursor-pointer"
            onClick={() => onSelectProblem?.(0)}
          >
            <div className="w-7 h-7 rounded-lg bg-[#B65A35]/15 text-[#B65A35] flex items-center justify-center">
              <FileText size={15} />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-[#1B3B28] flex items-center gap-1.5">
                <span>New Claim Form #2026-1492</span>
                <span className="px-1.5 py-0.2 rounded text-[8.5px] bg-[#B65A35] text-white font-mono">
                  JUST ARRIVED
                </span>
              </div>
              <p className="text-[10px] text-[#1B3B28]/60">
                Paddy crop damage · Flood photos attached
              </p>
            </div>
          </motion.div>

          {/* ── Alert Pins / Callout Chips Floating Around the Pile ── */}

          {/* Floating Tag 1: Misplaced Alert (Active on Problem #2) */}
          <motion.div
            animate={{
              scale: activeProblemIndex === 1 ? 1.05 : 0.98,
              boxShadow:
                activeProblemIndex === 1
                  ? "0 10px 25px -3px rgba(182, 90, 53, 0.35)"
                  : "0 4px 12px rgba(0, 0, 0, 0.05)",
            }}
            transition={{ duration: 0.3 }}
            className={`absolute left-1 sm:left-3 top-28 z-40 px-3 py-2 rounded-xl border backdrop-blur-md transition-all duration-300 ${
              activeProblemIndex === 1
                ? "bg-[#B65A35] text-white border-[#B65A35] ring-4 ring-[#B65A35]/20"
                : "bg-white/90 text-[#1B3B28] border-[#1B3B28]/15"
            }`}
          >
            <div className="flex items-center gap-1.5 text-[10.5px] font-semibold">
              <FileQuestion size={13} className={activeProblemIndex === 1 ? "text-amber-200" : "text-[#B65A35]"} />
              <span>File #0842 Misplaced!</span>
            </div>
            <p
              className={`text-[9px] mt-0.5 ${
                activeProblemIndex === 1 ? "text-white/80" : "text-[#1B3B28]/60"
              }`}
            >
              Land survey slip missing from folder
            </p>
          </motion.div>

          {/* Floating Tag 2: Processing Delay (Active on Problem #3 & #4) */}
          <motion.div
            animate={{
              scale: activeProblemIndex === 2 || activeProblemIndex === 3 ? 1.05 : 0.98,
              boxShadow:
                activeProblemIndex === 2 || activeProblemIndex === 3
                  ? "0 10px 25px -3px rgba(217, 154, 72, 0.35)"
                  : "0 4px 12px rgba(0, 0, 0, 0.05)",
            }}
            transition={{ duration: 0.3 }}
            className={`absolute right-1 sm:right-3 top-24 z-40 px-3 py-2 rounded-xl border backdrop-blur-md transition-all duration-300 ${
              activeProblemIndex === 2 || activeProblemIndex === 3
                ? "bg-[#D99A48] text-[#1B3B28] border-[#D99A48] font-medium ring-4 ring-[#D99A48]/20"
                : "bg-white/90 text-[#1B3B28] border-[#1B3B28]/15"
            }`}
          >
            <div className="flex items-center gap-1.5 text-[10.5px] font-semibold">
              <Clock size={13} className="text-[#1B3B28]" />
              <span>45+ Days In Backlog</span>
            </div>
            <p className="text-[9px] text-[#1B3B28]/70 mt-0.5">
              3.5 hrs manual cross-check per file
            </p>
          </motion.div>

          {/* ── THE PHYSICAL PAPER STACK ── */}
          <div className="relative w-full max-w-[360px] sm:max-w-[400px] flex flex-col items-center">
            {/* Layer 9 (Top Document - tilted right) */}
            <motion.div
              animate={{
                rotate: [3, 4, 3],
                y: activeProblemIndex === 0 ? [-2, 2, -2] : 0,
              }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="relative z-20 w-[84%] h-14 bg-white rounded-lg border border-[#1B3B28]/20 shadow-md p-3 -mb-9"
              style={{ transform: "rotate(3.5deg)" }}
            >
              <div className="flex items-center justify-between">
                <div className="space-y-1 w-2/3">
                  <div className="h-2 bg-[#1B3B28]/20 rounded-full w-full" />
                  <div className="h-1.5 bg-[#1B3B28]/12 rounded-full w-4/5" />
                  <div className="h-1.5 bg-[#1B3B28]/10 rounded-full w-2/3" />
                </div>
                <div className="px-2 py-0.5 border border-red-500/40 text-red-600 text-[8px] font-black uppercase rounded tracking-wider rotate-[-6deg]">
                  URGENT
                </div>
              </div>
            </motion.div>

            {/* Layer 8 (Manila Government Folder - tilted left) */}
            <motion.div
              animate={{
                rotate: [-2.5, -3, -2.5],
              }}
              transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
              className="relative z-19 w-[90%] h-16 bg-[#F3DEB2] rounded-lg border border-[#D99A48]/50 shadow-md p-3.5 -mb-9"
              style={{ transform: "rotate(-2.5deg)" }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded bg-[#D99A48]/30 flex items-center justify-center text-[#1B3B28]">
                    <Layers size={10} />
                  </div>
                  <span className="text-[10px] font-mono font-bold text-[#1B3B28]/80">
                    DOSSIER: TALUK-BARABANKI-2026
                  </span>
                </div>
                <span className="text-[8.5px] font-semibold text-[#B65A35] bg-[#B65A35]/10 px-1.5 py-0.5 rounded">
                  84 Forms Inside
                </span>
              </div>
              <div className="mt-2 h-1 bg-[#1B3B28]/10 rounded-full w-1/2" />
            </motion.div>

            {/* Layer 7 (White Claim Application - rotated slightly right) */}
            <div
              className="relative z-18 w-[92%] h-15 bg-white rounded-lg border border-[#1B3B28]/15 shadow-sm p-3 -mb-8"
              style={{ transform: "rotate(1.8deg)" }}
            >
              <div className="flex items-center justify-between">
                <div className="space-y-1 w-3/4">
                  <div className="h-2 bg-[#1B3B28]/15 rounded-full w-3/4" />
                  <div className="h-1.5 bg-[#1B3B28]/10 rounded-full w-1/2" />
                </div>
                <span className="text-[8px] text-[#1B3B28]/50 font-mono">OCT 24</span>
              </div>
            </div>

            {/* Layer 6 (Green Revenue File - tilted left) */}
            <div
              className="relative z-17 w-[94%] h-16 bg-[#E2EBD8] rounded-lg border border-[#234B32]/30 shadow-md p-3 -mb-9"
              style={{ transform: "rotate(-3.8deg)" }}
            >
              <div className="flex items-center justify-between text-[9.5px] font-semibold text-[#1B3B28]">
                <span>7/12 Land Patta Extracts</span>
                <span className="text-[#B65A35] font-mono text-[8px]">UNCHECKED</span>
              </div>
              <div className="mt-2 space-y-1">
                <div className="h-1.5 bg-[#1B3B28]/15 rounded-full w-2/3" />
                <div className="h-1.5 bg-[#1B3B28]/10 rounded-full w-1/3" />
              </div>
            </div>

            {/* Layer 5 (Slipping / Misplaced File! Highlighted on Problem #2) */}
            <motion.div
              animate={{
                x: activeProblemIndex === 1 ? -22 : -10,
                rotate: activeProblemIndex === 1 ? -8 : -5,
              }}
              transition={{ duration: 0.4 }}
              className={`relative z-25 w-[88%] h-16 rounded-lg border shadow-lg p-3 -mb-8 cursor-pointer transition-colors ${
                activeProblemIndex === 1
                  ? "bg-[#FEF2F2] border-red-400 ring-2 ring-red-400/40"
                  : "bg-[#FFF9EE] border-[#D99A48]/40"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  <span className="text-[10px] font-bold text-red-700">
                    SLIPPED OUT: Farmer Ram Lal
                  </span>
                </div>
                <span className="text-[8px] px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-bold uppercase">
                  MISSING
                </span>
              </div>
              <p className="text-[8.5px] text-red-600/80 mt-1">
                No tracking ID · Stored in wrong cubby
              </p>
            </motion.div>

            {/* Layer 4 (Stack of bulk applications) */}
            <div
              className="relative z-15 w-[96%] h-14 bg-white/95 rounded-lg border border-[#1B3B28]/15 shadow-sm p-3 -mb-7"
              style={{ transform: "rotate(2.2deg)" }}
            >
              <div className="flex items-center justify-between">
                <div className="h-2 bg-[#1B3B28]/15 rounded-full w-3/5" />
                <div className="h-2 bg-[#1B3B28]/10 rounded-full w-1/5" />
              </div>
            </div>

            {/* Layer 3 (Old weather printout stack) */}
            <div
              className="relative z-14 w-[98%] h-14 bg-[#F7F2E7] rounded-lg border border-[#1B3B28]/12 shadow-sm p-3 -mb-7"
              style={{ transform: "rotate(-1.5deg)" }}
            >
              <div className="flex items-center justify-between text-[9px] text-[#1B3B28]/60">
                <span>Rainfall Gauge Printouts (Printed Sep 12)</span>
                <span className="font-mono">P-41</span>
              </div>
            </div>

            {/* Layer 2 (Heavy base legal binder) */}
            <div
              className="relative z-13 w-full h-16 bg-[#E8DEC7] rounded-lg border-2 border-[#1B3B28]/20 shadow-md p-3.5 -mb-6"
              style={{ transform: "rotate(0.5deg)" }}
            >
              <div className="flex items-center justify-between text-[10px] font-bold text-[#1B3B28]">
                <span>ANNUAL CLAIMS LOGBOOK · VOL. IV</span>
                <span className="text-[8.5px] text-[#1B3B28]/60 font-mono">1,420 PAGES</span>
              </div>
            </div>

            {/* Layer 1 (The Officer's Wooden Desk Surface) */}
            <div className="relative z-10 w-[104%] h-10 bg-gradient-to-r from-[#8B5A2B] via-[#A0522D] to-[#8B5A2B] rounded-xl border-t-2 border-[#D4A373]/40 shadow-xl flex items-center justify-between px-4">
              <span className="text-[9.5px] text-[#FAF3E5]/70 font-mono tracking-wider">
                DESK: CLAIMS OFFICER #03
              </span>
              <span className="text-[9px] text-[#FAF3E5]/90 font-medium">
                Piled since Kharif 2025
              </span>
            </div>
          </div>

          {/* Red Rubber Stamp Effect Overlay */}
          <motion.div
            initial={{ scale: 1.5, opacity: 0, rotate: -25 }}
            animate={{ scale: 1, opacity: 0.85, rotate: -14 }}
            transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
            className="absolute bottom-16 right-3 sm:right-6 z-30 pointer-events-none"
          >
            <div className="border-[3px] border-dashed border-[#B65A35] rounded-xl px-3 py-1.5 bg-[#B65A35]/5 backdrop-blur-[1px]">
              <span className="text-[12px] sm:text-[13px] font-black uppercase tracking-widest text-[#B65A35] font-mono block text-center">
                MANUAL DELAY
              </span>
              <span className="text-[8px] font-bold text-[#B65A35]/80 block text-center tracking-wider">
                PENDING PHYSICAL AUDIT
              </span>
            </div>
          </motion.div>
        </div>

        {/* ── Footer Summary inside Illustration Box ── */}
        <div className="relative z-10 mt-5 pt-3 border-t border-[#1B3B28]/10 flex flex-wrap items-center justify-between gap-2 text-[11px] sm:text-[12px] text-[#1B3B28]/70">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            1,420+ physical files awaiting manual cross-check
          </span>
          <span className="text-[10.5px] font-mono text-[#B65A35] font-semibold">
            Avg. resolution: 45 to 60 days
          </span>
        </div>
      </div>
    </div>
  );
}
