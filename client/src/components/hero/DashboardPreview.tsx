"use client";

import { motion } from "motion/react";
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Eye,
  CloudRain,
  Fingerprint,
  Search,
  Bell,
  ChevronDown,
  BarChart3,
  FileText,
  Users,
  Sparkles,
  ArrowRight,
} from "lucide-react";

/** Fake claim data for the demonstration dashboard */
const claims = [
  {
    id: "KC-2026-0847",
    farmer: "Rajesh Patel",
    crop: "Paddy",
    plot: "Plot #14A · Barabanki",
    peril: "Flooding",
    status: "Ready for Review",
    statusColor: "text-emerald-700 bg-emerald-50 border-emerald-200",
    priority: "High",
    priorityColor: "text-rose-700 bg-rose-50 border-rose-200",
    ground: true,
    sky: true,
    device: true,
  },
  {
    id: "KC-2026-0851",
    farmer: "Sunita Devi",
    crop: "Wheat",
    plot: "Plot #03B · Hoshangabad",
    peril: "Lodging",
    status: "Analyzing",
    statusColor: "text-amber-700 bg-amber-50 border-amber-200",
    priority: "Medium",
    priorityColor: "text-amber-700 bg-amber-50 border-amber-200",
    ground: true,
    sky: false,
    device: true,
  },
  {
    id: "KC-2026-0853",
    farmer: "Mohan Singh",
    crop: "Cotton",
    plot: "Plot #09 · Vidarbha",
    peril: "Drought",
    status: "Mismatch Flagged",
    statusColor: "text-orange-700 bg-orange-50 border-orange-200",
    priority: "Needs Review",
    priorityColor: "text-slate-600 bg-slate-100 border-slate-200",
    ground: false,
    sky: false,
    device: false,
  },
  {
    id: "KC-2026-0856",
    farmer: "Lata Kumari",
    crop: "Paddy",
    plot: "Plot #22 · Sambalpur",
    peril: "Flooding",
    status: "Ready for Review",
    statusColor: "text-emerald-700 bg-emerald-50 border-emerald-200",
    priority: "High",
    priorityColor: "text-rose-700 bg-rose-50 border-rose-200",
    ground: true,
    sky: true,
    device: true,
  },
];

const stats = [
  { label: "Claims In Queue", value: "148", change: "+14 today", icon: FileText },
  { label: "Ready for Review", value: "42", change: "Triaged by AI", icon: Eye },
  { label: "Avg. Triage Time", value: "3.8 min", change: "92% faster", icon: BarChart3 },
  { label: "Corroboration", value: "96.4%", change: "Weather + Vision", icon: ShieldCheck },
];

function EvidenceDot({ active, label, icon: Icon }: { active: boolean; label: string; icon: typeof Eye }) {
  return (
    <div
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8.5px] font-medium ${
        active
          ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
          : "bg-slate-50 text-slate-400 border border-slate-200/40"
      }`}
      title={`${label}: ${active ? "Verified" : "Pending"}`}
    >
      <Icon size={9} strokeWidth={2} />
      <span>{label}</span>
    </div>
  );
}

export default function DashboardPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, filter: "blur(12px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{
        duration: 1.1,
        delay: 1.25,
        ease: [0.16, 1, 0.3, 1] as const,
      }}
      className="relative mt-12 sm:mt-16 mx-auto w-full max-w-[1160px] px-3 sm:px-6"
    >
      {/* ── Soft symmetrical ambient backdrop glow ── */}
      <div
        className="absolute inset-x-8 top-10 bottom-4
                   bg-[#1B3B28]/[0.08] rounded-3xl blur-3xl -z-10"
      />

      {/* ── Floating callout pills (inspired by reference CloudNexus layout) ── */}
      {/* Callout 1 (Left floating pill) */}
      <motion.div
        initial={{ opacity: 0, x: -16, y: -8 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ duration: 0.8, delay: 1.8, ease: "easeOut" }}
        className="hidden lg:flex items-center gap-2 absolute -top-4 left-10 z-30
                   px-3.5 py-1.5 rounded-full
                   bg-white/95 backdrop-blur-md
                   border border-[#1B3B28]/12
                   shadow-[0_8px_24px_rgba(27,59,40,0.1)]
                   text-[11px] font-medium text-slate-700"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        <span>72h Rainfall Corroborated with Open-Meteo</span>
      </motion.div>

      {/* Callout 2 (Right floating pill) */}
      <motion.div
        initial={{ opacity: 0, x: 16, y: -8 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ duration: 0.8, delay: 2.0, ease: "easeOut" }}
        className="hidden lg:flex items-center gap-2 absolute top-28 -right-2 z-30
                   px-3.5 py-1.5 rounded-full
                   bg-white/95 backdrop-blur-md
                   border border-amber-500/25
                   shadow-[0_8px_24px_rgba(217,154,72,0.12)]
                   text-[11px] font-medium text-slate-700"
      >
        <span className="w-2 h-2 rounded-full bg-[#D99A48]" />
        <span>Policy gate checked against PMFBY registry</span>
      </motion.div>

      {/* ── Main Dashboard Window ── */}
      <div
        className="relative overflow-hidden rounded-2xl
                   border border-[#1B3B28]/10
                   bg-white/90 backdrop-blur-xl
                   shadow-[0_2px_8px_rgba(0,0,0,0.03),0_20px_60px_rgba(27,59,40,0.09)]"
      >
        {/* Top bar (window header) */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#28C840]/80" />
            </div>
            <div className="hidden sm:flex items-center gap-1.5 ml-4 px-2.5 py-0.5 rounded-md bg-white border border-slate-200/60 text-[10.5px] text-slate-500 font-mono">
              <span>portal.kisaanchakshu.gov.in/officer/triage</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[9.5px] font-semibold border border-emerald-200/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Live Demonstration
            </span>
            <span className="w-7 h-7 rounded-full bg-slate-100 grid place-items-center text-slate-500 hover:bg-slate-200 transition-colors cursor-pointer">
              <Bell size={13} />
            </span>
            <div className="w-7 h-7 rounded-full bg-[#1B3B28] text-[#FAF3E5] grid place-items-center text-[10px] font-bold">
              AK
            </div>
          </div>
        </div>

        {/* Dashboard inner layout */}
        <div className="flex">
          {/* Sidebar */}
          <aside className="hidden md:flex flex-col w-[210px] border-r border-slate-100 bg-slate-50/40 p-4 flex-shrink-0">
            <div className="flex items-center gap-2 px-2 mb-6">
              <div className="w-6 h-6 rounded-md bg-[#1B3B28] grid place-items-center text-white">
                <Eye size={12} strokeWidth={2} />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-800 leading-tight">
                  Officer Workspace
                </p>
                <p className="text-[8.5px] text-slate-400 font-medium">Barabanki District</p>
              </div>
            </div>

            <nav className="space-y-1">
              {[
                { label: "Claims Triage", active: true, icon: FileText, count: "42" },
                { label: "Policy Exceptions", active: false, icon: AlertTriangle, count: "5" },
                { label: "Weather Witnesses", active: false, icon: CloudRain },
                { label: "Officer Queue", active: false, icon: Users },
                { label: "Audit Reports", active: false, icon: BarChart3 },
              ].map((item) => (
                <div
                  key={item.label}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-[11px] font-medium transition-colors ${
                    item.active
                      ? "bg-[#1B3B28] text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100/70"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <item.icon size={13} strokeWidth={1.8} />
                    <span>{item.label}</span>
                  </div>
                  {item.count && (
                    <span
                      className={`text-[9.5px] font-semibold px-1.5 py-0.2 rounded ${
                        item.active
                          ? "bg-white/20 text-white"
                          : "bg-slate-200/60 text-slate-500"
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </div>
              ))}
            </nav>

            <div className="mt-auto pt-4 border-t border-slate-200/60">
              <div className="flex items-center gap-2 px-1">
                <div className="flex-1">
                  <p className="text-[10px] font-semibold text-slate-700">A. Kumar</p>
                  <p className="text-[8.5px] text-slate-400">Claims Officer #04</p>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
            </div>
          </aside>

          {/* Main workspace area */}
          <main className="flex-1 min-w-0 p-4 sm:p-6">
            {/* Page title row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-[17px] sm:text-[18px] font-bold text-slate-900 tracking-tight">
                    Assessment Queue
                  </h3>
                  <span className="text-[10px] text-slate-400 font-medium">· Updated just now</span>
                </div>
                <p className="text-[11.5px] text-slate-500 mt-0.5">
                  AI-graded claims prioritized by severity and corroboration strength.
                </p>
              </div>

              {/* Search + filter */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-400 text-[11px]">
                  <Search size={12} />
                  <span>Search farmer, plot, ID...</span>
                </div>
              </div>
            </div>

            {/* Metric KPI cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 mb-5">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/40"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-wider">
                      {stat.label}
                    </span>
                    <stat.icon size={13} className="text-slate-400" />
                  </div>
                  <p className="text-[20px] sm:text-[22px] font-bold text-slate-800 tracking-tight">
                    {stat.value}
                  </p>
                  <p className="text-[9.5px] text-emerald-600 font-medium mt-0.5">
                    {stat.change}
                  </p>
                </div>
              ))}
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 mb-3.5 overflow-x-auto pb-1">
              {["All Claims (42)", "Flooding (18)", "Lodging (12)", "Drought (8)", "Needs Correction (4)"].map(
                (tab, i) => (
                  <span
                    key={tab}
                    className={`px-3 py-1 rounded-full text-[10px] font-semibold cursor-pointer whitespace-nowrap transition-colors ${
                      i === 0
                        ? "bg-[#1B3B28] text-white shadow-xs"
                        : "bg-slate-100/80 text-slate-600 hover:bg-slate-200/70"
                    }`}
                  >
                    {tab}
                  </span>
                )
              )}
            </div>

            {/* Claims Table */}
            <div className="rounded-xl border border-slate-100 overflow-hidden bg-white shadow-xs">
              {/* Header */}
              <div className="grid grid-cols-[1.1fr_0.9fr_0.8fr_0.9fr_1.1fr_0.6fr] gap-2 px-4 py-2.5 bg-slate-50/70 border-b border-slate-100 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                <span>Claim Identifier</span>
                <span>Farmer & Plot</span>
                <span>Claimed Peril</span>
                <span>Workflow State</span>
                <span>Three Witnesses</span>
                <span className="text-right">Priority</span>
              </div>

              {/* Rows */}
              {claims.map((claim, i) => (
                <div
                  key={claim.id}
                  className={`grid grid-cols-[1.1fr_0.9fr_0.8fr_0.9fr_1.1fr_0.6fr] gap-2 px-4 py-3 items-center
                    ${i < claims.length - 1 ? "border-b border-slate-100/70" : ""}
                    hover:bg-slate-50/70 transition-colors`}
                >
                  {/* ID */}
                  <div>
                    <span className="text-[11.5px] font-semibold text-slate-800">
                      {claim.id}
                    </span>
                    <span className="block text-[9px] text-slate-400">PMFBY-2026</span>
                  </div>

                  {/* Farmer */}
                  <div>
                    <span className="text-[11px] font-medium text-slate-700 block truncate">
                      {claim.farmer}
                    </span>
                    <span className="text-[8.5px] text-slate-400 truncate block">
                      {claim.plot}
                    </span>
                  </div>

                  {/* Peril & Crop */}
                  <div>
                    <span className="text-[11px] font-semibold text-slate-700 block">
                      {claim.peril}
                    </span>
                    <span className="text-[9px] text-slate-400">{claim.crop}</span>
                  </div>

                  {/* Status */}
                  <div>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold border ${claim.statusColor}`}
                    >
                      {claim.status === "Ready for Review" && <CheckCircle2 size={9} />}
                      {claim.status === "Analyzing" && <Clock size={9} />}
                      {claim.status === "Mismatch Flagged" && <AlertTriangle size={9} />}
                      <span>{claim.status}</span>
                    </span>
                  </div>

                  {/* Evidence Dots */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <EvidenceDot active={claim.ground} label="Ground" icon={Eye} />
                    <EvidenceDot active={claim.sky} label="Sky" icon={CloudRain} />
                    <EvidenceDot active={claim.device} label="Device" icon={Fingerprint} />
                  </div>

                  {/* Priority */}
                  <div className="text-right">
                    <span
                      className={`inline-block text-[9.5px] font-bold px-2 py-0.5 rounded-md border ${claim.priorityColor}`}
                    >
                      {claim.priority}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </main>
        </div>

        {/* ── Symmetrical soft edge fades at bottom and sides ── */}
        <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-white via-white/70 to-transparent pointer-events-none z-10" />
        <div className="absolute top-0 bottom-0 left-0 w-8 bg-gradient-to-r from-white via-white/30 to-transparent pointer-events-none z-10" />
        <div className="absolute top-0 bottom-0 right-0 w-8 bg-gradient-to-l from-white via-white/30 to-transparent pointer-events-none z-10" />
      </div>
    </motion.div>
  );
}
