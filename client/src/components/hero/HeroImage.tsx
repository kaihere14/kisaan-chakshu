"use client";

import { motion } from "motion/react";
import Image from "next/image";

/**
 * Displays the farming illustration as a framed "product showcase" image
 * below the hero text — matching the CloudNexus-style layout.
 *
 * Symmetrical soft gradient fading on all edges, rounded corners,
 * subtle shadow, and a slight upward entrance animation.
 */
export default function HeroImage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 1,
        delay: 1.2,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="relative mt-12 sm:mt-16 mx-auto w-full max-w-[1100px]
                 px-4 sm:px-6"
    >
      {/* Outer glow / ambient shadow */}
      <div
        className="absolute inset-x-8 top-8 bottom-0
                   bg-[#1A3A2A]/[0.04] rounded-3xl blur-3xl -z-10"
      />

      {/* Main image container */}
      <div
        className="relative overflow-hidden rounded-xl sm:rounded-2xl
                   border border-[#1A3A2A]/[0.06]
                   shadow-[0_2px_8px_rgba(0,0,0,0.04),0_12px_48px_rgba(26,58,42,0.08)]"
      >
        {/* The illustration */}
        <Image
          src="/images/hero-bg.jpg"
          alt="Illustration of Indian farming — a woman in traditional green and red attire sits beneath a tree with a basket of vegetables, overlooking lush paddy fields, a farmer walking along a canal, a red tractor in the distance, and a sunset over historic architecture and green hills"
          width={1920}
          height={1080}
          priority
          quality={90}
          sizes="(max-width: 768px) 95vw, (max-width: 1200px) 90vw, 1100px"
          className="w-full h-auto object-cover"
        />

        {/* ── Symmetrical edge fading ── */}
        {/* Top fade */}
        <div
          className="absolute top-0 left-0 right-0 h-24 sm:h-32
                     bg-gradient-to-b from-[#FAFAFA] via-[#FAFAFA]/50 to-transparent
                     pointer-events-none"
        />
        {/* Bottom fade */}
        <div
          className="absolute bottom-0 left-0 right-0 h-28 sm:h-36
                     bg-gradient-to-t from-[#FAFAFA] via-[#FAFAFA]/50 to-transparent
                     pointer-events-none"
        />
        {/* Left fade */}
        <div
          className="absolute top-0 bottom-0 left-0 w-16 sm:w-24
                     bg-gradient-to-r from-[#FAFAFA] via-[#FAFAFA]/30 to-transparent
                     pointer-events-none"
        />
        {/* Right fade */}
        <div
          className="absolute top-0 bottom-0 right-0 w-16 sm:w-24
                     bg-gradient-to-l from-[#FAFAFA] via-[#FAFAFA]/30 to-transparent
                     pointer-events-none"
        />
      </div>
    </motion.div>
  );
}
