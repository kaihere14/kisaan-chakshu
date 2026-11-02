"use client";

import { motion } from "motion/react";
import { Sparkles } from "lucide-react";

export default function HeroBadge() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, filter: "blur(12px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] as const }}
      className="flex justify-center"
    >
      <a
        href="/#how-it-works"
        className="inline-flex items-center gap-2
                   px-4 py-1.5 rounded-full
                   bg-[#1B3B28]/[0.06] backdrop-blur-md
                   border border-[#1B3B28]/12
                   text-[12px] font-medium text-[#1B3B28]/80
                   hover:bg-[#1B3B28]/10 hover:border-[#1B3B28]/20
                   shadow-[0_1px_4px_rgba(27,59,40,0.04)]
                   transition-all duration-300
                   group cursor-pointer"
      >
        <span className="flex items-center justify-center w-[18px] h-[18px] rounded-full bg-[#D99A48]/20">
          <Sparkles size={11} className="text-[#D99A48]" />
        </span>
        <span>AI-Powered Crop Insurance Assistance</span>
      </a>
    </motion.div>
  );
}
