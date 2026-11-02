"use client";

import { motion } from "motion/react";
import {
  Layers,
  FileX2,
  Clock,
  HeartCrack,
  AlertTriangle,
  ChevronRight,
  ArrowRight,
  Flame,
} from "lucide-react";

export interface ProblemItem {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  description: string;
  badge: string;
  badgeColor: string;
  icon: typeof Layers;
  impactMetric: string;
}

export const PROBLEMS_DATA: ProblemItem[] = [
  {
    id: "piled-up",
    number: "01",
    title: "Manual paperwork takes time, and the work relentlessly piles up",
    subtitle: "Physical forms arrive faster than human hands can process",
    description:
      "When a severe flood or storm strikes a district, thousands of paper applications, photo printouts, and revenue receipts hit the taluk office all at once. Without automation, every single file must be physically opened, stamped, and stacked—creating towering backlogs within days.",
    badge: "Overwhelming Backlog",
    badgeColor: "text-[#B65A35] bg-[#B65A35]/10 border-[#B65A35]/25",
    icon: Layers,
    impactMetric: "+1,400 new paper files per week during peak calamities",
  },
  {
    id: "files-missed",
    number: "02",
    title: "Crucial files get missed and buried deep in the heap",
    subtitle: "A misplaced survey slip can freeze a claim for months",
    description:
      "In giant physical stacks, individual damage slips, land survey certificates, or bank account proofs slip loose or end up in the wrong cabinet. With zero digital tracking, officers cannot easily search for a claim, and cases sit unnoticed until a farmer follows up in person.",
    badge: "Lost & Misplaced Files",
    badgeColor: "text-red-700 bg-red-50 border-red-200",
    icon: FileX2,
    impactMetric: "1 in 6 claims stalled due to missing or untraceable physical documents",
  },
  {
    id: "verification-paralysis",
    number: "03",
    title: "Manual verification takes hours per claim",
    subtitle: "Cross-referencing crop, land, and weather records by hand",
    description:
      "An officer must manually cross-verify the farmer's identity, land holding records (7/12 extracts), nearby rain gauge logs, and crop photo authenticity across separate offline registers. Backlogs snowball as each manual audit takes hours.",
    badge: "Processing Bottleneck",
    badgeColor: "text-amber-800 bg-amber-50 border-amber-200",
    icon: Clock,
    impactMetric: "3 to 4 hours required for a single manual dossier cross-check",
  },
  {
    id: "farmer-limbo",
    number: "04",
    title: "Distressed farmers wait months while critical sowing windows pass",
    subtitle: "Relief arrives too late to prepare for the next season",
    description:
      "When a crop is destroyed, the farmer has an immediate 2-to-3 week window to prepare fields and purchase seeds for the next crop. Because manual files stay stuck in processing queues for 45 to 90 days, farmers are forced into high-interest emergency borrowing.",
    badge: "Delayed Relief",
    badgeColor: "text-[#B65A35] bg-[#B65A35]/10 border-[#B65A35]/25",
    icon: HeartCrack,
    impactMetric: "45–90 days typical wait time for claim determination",
  },
  {
    id: "officer-strain",
    number: "05",
    title: "Overwhelmed officers forced to triage without intelligent priority",
    subtitle: "No automated urgency grading or fraud detection",
    description:
      "Exhausted field officers must review claims on an arbitrary first-in, first-out basis. Genuine, catastrophic crop failures are buried beneath low-priority or mismatched filings, leaving officials with no objective way to triage what needs attention first.",
    badge: "Administrative Strain",
    badgeColor: "text-stone-700 bg-stone-100 border-stone-200",
    icon: AlertTriangle,
    impactMetric: "Zero automated triage or urgency indicators in manual workflows",
  },
];

interface ProblemCardListProps {
  activeIndex: number;
  onSelectIndex: (index: number) => void;
}

export default function ProblemCardList({
  activeIndex,
  onSelectIndex,
}: ProblemCardListProps) {
  return (
    <div className="flex flex-col gap-3.5 sm:gap-4">
      {PROBLEMS_DATA.map((problem, index) => {
        const isActive = activeIndex === index;
        const IconComponent = problem.icon;

        return (
          <motion.article
            key={problem.id}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{
              duration: 0.5,
              delay: index * 0.1,
              ease: [0.16, 1, 0.3, 1],
            }}
            onClick={() => onSelectIndex(index)}
            className={`group relative rounded-2xl p-4 sm:p-5 transition-all duration-300 cursor-pointer border text-left ${
              isActive
                ? "bg-[#FAF3E5] border-[#1B3B28]/35 shadow-[0_4px_16px_rgba(27,59,40,0.08),0_12px_28px_rgba(27,59,40,0.05)] ring-1 ring-[#1B3B28]/20"
                : "bg-white/70 hover:bg-white border-[#1B3B28]/10 hover:border-[#1B3B28]/20 shadow-sm"
            }`}
          >
            {/* Top row: Number, Badge, and Icon */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span
                  className={`flex items-center justify-center w-7 h-7 rounded-lg text-xs font-mono font-bold transition-colors ${
                    isActive
                      ? "bg-[#1B3B28] text-[#FAF3E5]"
                      : "bg-[#1B3B28]/8 text-[#1B3B28]/70 group-hover:bg-[#1B3B28]/15"
                  }`}
                >
                  {problem.number}
                </span>

                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${problem.badgeColor}`}
                >
                  {problem.badge}
                </span>
              </div>

              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  isActive
                    ? "bg-[#B65A35]/15 text-[#B65A35]"
                    : "text-[#1B3B28]/40 group-hover:text-[#1B3B28]/70"
                }`}
              >
                <IconComponent size={16} strokeWidth={1.75} />
              </div>
            </div>

            {/* Title */}
            <h3 className="mt-3 text-[16px] sm:text-[17px] font-semibold text-[#1B3B28] leading-[1.35] tracking-[-0.01em]">
              {problem.title}
            </h3>

            {/* Expanded details when active, or summarized when inactive */}
            <p
              className={`mt-1.5 text-[13px] sm:text-[14px] leading-relaxed transition-colors ${
                isActive ? "text-[#1B3B28]/80 font-normal" : "text-[#1B3B28]/60 line-clamp-2"
              }`}
            >
              {problem.description}
            </p>

            {/* Metric pill when active */}
            {isActive && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-3 pt-3 border-t border-[#1B3B28]/10 flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-1.5 text-[11.5px] font-semibold text-[#B65A35]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#B65A35]" />
                  <span>{problem.impactMetric}</span>
                </div>

                <span className="text-[11px] font-medium text-[#1B3B28]/50 flex items-center gap-0.5 group-hover:text-[#1B3B28]">
                  Viewing on stack
                  <ChevronRight size={12} />
                </span>
              </motion.div>
            )}
          </motion.article>
        );
      })}
    </div>
  );
}
