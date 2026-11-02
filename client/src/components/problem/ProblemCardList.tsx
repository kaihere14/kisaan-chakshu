"use client";

import { motion } from "motion/react";
import {
  Layers,
  FileX2,
  ChevronRight,
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
    title: "The Work Piles Up",
    subtitle: "Manual work takes time, creating towering paper backlogs",
    description:
      "When extreme weather hits, thousands of physical claim forms, printed photographs, and revenue receipts arrive at taluk offices all at once. Without automated screening, every single file must be physically opened, stamped, and stacked—creating unmanageable backlogs within days.",
    badge: "Overwhelming Backlog",
    badgeColor: "text-[#B65A35] bg-[#B65A35]/10 border-[#B65A35]/25",
    icon: Layers,
    impactMetric: "+1,400 new paper files arrive per week during peak calamities",
  },
  {
    id: "files-missed",
    number: "02",
    title: "Files Get Missed",
    subtitle: "Important land records and claims get buried in the heap",
    description:
      "In giant physical stacks, individual damage slips, land survey certificates, and bank account proofs slip loose or get misfiled at the bottom of the pile. With zero digital tracking, officers cannot trace where a file is, leaving urgent claims frozen for months.",
    badge: "Lost & Misplaced Files",
    badgeColor: "text-red-700 bg-red-50 border-red-200",
    icon: FileX2,
    impactMetric: "1 in 6 claims stalled due to untraceable or missing physical documents",
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
    <div className="flex flex-col gap-4 sm:gap-5">
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
              delay: index * 0.15,
              ease: [0.16, 1, 0.3, 1],
            }}
            onClick={() => onSelectIndex(index)}
            className={`group relative rounded-2xl p-5 sm:p-6 transition-all duration-300 cursor-pointer border text-left ${
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
                <IconComponent size={17} strokeWidth={1.75} />
              </div>
            </div>

            {/* Title */}
            <h3 className="mt-3.5 text-[18px] sm:text-[19px] font-semibold text-[#1B3B28] leading-[1.3] tracking-[-0.01em]">
              {problem.title}
            </h3>

            {/* Description */}
            <p className="mt-2 text-[14px] sm:text-[14.5px] leading-relaxed text-[#1B3B28]/75 font-normal">
              {problem.description}
            </p>

            {/* Metric pill */}
            <div className="mt-4 pt-3.5 border-t border-[#1B3B28]/10 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-[12px] font-semibold text-[#B65A35]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#B65A35]" />
                <span>{problem.impactMetric}</span>
              </div>

              <span
                className={`text-[11px] font-medium flex items-center gap-0.5 transition-colors ${
                  isActive ? "text-[#1B3B28]" : "text-[#1B3B28]/40 group-hover:text-[#1B3B28]/70"
                }`}
              >
                {isActive ? "Active on stack" : "Click to view"}
                <ChevronRight size={12} />
              </span>
            </div>
          </motion.article>
        );
      })}
    </div>
  );
}
