"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Eye, Leaf, Menu, X, Globe, ArrowUpRight } from "lucide-react";
import Link from "next/link";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "About", href: "/#about" },
  { label: "How It Works", href: "/#how-it-works" },
];

export default function HeroNavbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Detach from top after scrolling past 20px
      setIsScrolled(window.scrollY > 20);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] as const }}
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ease-out ${
        isScrolled
          ? "pt-3 sm:pt-4 px-4 sm:px-6 lg:px-8"
          : "pt-0 px-5 sm:px-8 lg:px-12"
      }`}
    >
      <div
        className={`mx-auto transition-all duration-300 ease-out ${
          isScrolled
            ? "max-w-[1200px] bg-white/85 backdrop-blur-xl border border-[#1B3B28]/10 rounded-2xl shadow-[0_4px_24px_rgba(27,59,40,0.06),0_1px_2px_rgba(0,0,0,0.03)]"
            : menuOpen
            ? "max-w-[1300px] bg-white/90 backdrop-blur-lg border-b border-[#1B3B28]/10 rounded-b-2xl shadow-sm"
            : "max-w-[1300px] bg-transparent border-transparent shadow-none rounded-none"
        }`}
      >
        <nav
          className={`flex items-center justify-between transition-all duration-300 ${
            isScrolled
              ? "px-5 sm:px-7 py-2.5 sm:py-3"
              : "px-2 sm:px-4 py-4 sm:py-5"
          }`}
          role="navigation"
          aria-label="Main navigation"
        >
          {/* Brand */}
          <Link
            href="/"
            className="flex items-center gap-2.5 group"
            aria-label="Kisaan Chakshu — Home"
          >
            <span
              className={`relative w-8 h-8 grid place-items-center rounded-full transition-colors duration-300 ${
                isScrolled
                  ? "border border-[#1B3B28]/15 group-hover:border-[#1B3B28]/30"
                  : "border border-[#1B3B28]/25 bg-white/40 backdrop-blur-xs group-hover:border-[#1B3B28]/50"
              }`}
            >
              <Eye size={17} strokeWidth={1.6} className="text-[#1B3B28]" />
              <Leaf
                size={10}
                className="absolute -top-1 -right-0.5 text-[#D99A48] fill-[#D99A48]"
              />
            </span>
            <span className="text-[#1B3B28] text-[15px] font-semibold tracking-tight leading-none">
              Kisaan
              <span className="font-normal text-[#1B3B28]/70 ml-0.5">Chakshu</span>
            </span>
          </Link>

          {/* Center Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="px-3.5 py-1.5 text-[13px] text-[#1B3B28]/75
                           hover:text-[#1B3B28] rounded-lg
                           hover:bg-[#1B3B28]/[0.06]
                           transition-all duration-200 font-medium"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right Side */}
          <div className="hidden md:flex items-center gap-2">
            <button
              className="flex items-center gap-1.5 text-[12px] text-[#1B3B28]/65
                         hover:text-[#1B3B28] transition-colors duration-200
                         px-2.5 py-1.5 rounded-lg hover:bg-[#1B3B28]/[0.05]"
              aria-label="Toggle language"
            >
              <Globe size={14} strokeWidth={1.5} />
              <span className="font-medium">EN</span>
            </button>

            <span className="w-px h-4 bg-[#1B3B28]/15 mx-1" />

            <Link
              href="/claims/new"
              className="inline-flex items-center gap-2 px-4 py-2
                         bg-[#1B3B28] text-[#FAF3E5] text-[12.5px] font-semibold
                         rounded-xl
                         hover:bg-[#142C1E]
                         active:scale-[0.98]
                         shadow-[0_2px_8px_rgba(27,59,40,0.18)]
                         transition-all duration-200"
            >
              Get Started
              <ArrowUpRight size={13} strokeWidth={2.2} />
            </Link>
          </div>

          {/* Mobile Toggle */}
          <button
            className="md:hidden p-2 text-[#1B3B28]/70 hover:text-[#1B3B28]
                       hover:bg-[#1B3B28]/[0.06] rounded-lg transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </nav>

        {/* Mobile Dropdown */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              id="mobile-menu"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] as const }}
              className="md:hidden border-t border-[#1B3B28]/10 px-5 py-4 overflow-hidden"
            >
              <div className="flex flex-col gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="px-3 py-2 text-[14px] text-[#1B3B28] font-medium rounded-lg hover:bg-[#1B3B28]/5"
                  >
                    {link.label}
                  </Link>
                ))}

                <div className="mt-2 pt-3 border-t border-[#1B3B28]/10 flex flex-col gap-2">
                  <button
                    className="flex items-center gap-2 px-3 py-2 text-[13px] text-[#1B3B28]/70"
                    aria-label="Toggle language"
                  >
                    <Globe size={14} />
                    English / हिन्दी
                  </button>

                  <Link
                    href="/claims/new"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#1B3B28] text-white text-[13px] font-semibold rounded-xl"
                  >
                    Get Started
                    <ArrowUpRight size={13} strokeWidth={2.2} />
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
}
