import type { Metadata } from "next";
import { Inter, Laila } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import "./portal.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

/** Laila — Unicode Devanagari display face for the Hindi hero line. */
const laila = Laila({
  weight: "400",
  subsets: ["devanagari"],
  variable: "--font-hindi",
  display: "swap",
  fallback: ["Georgia", "Times New Roman", "serif"],
});

/**
 * Instrument Serif — a refined, modern editorial serif.
 * Loaded from Google Fonts CDN via next/font local approach
 * for maximum control. Falls back to Georgia.
 */
const instrumentSerif = localFont({
  src: [
    {
      path: "../fonts/InstrumentSerif-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../fonts/InstrumentSerif-Italic.ttf",
      weight: "400",
      style: "italic",
    },
  ],
  variable: "--font-serif",
  display: "swap",
  fallback: ["Georgia", "Times New Roman", "serif"],
});

export const metadata: Metadata = {
  title: "Kisaan Chakshu — Har Fasal Ka Bharosa",
  description:
    "Simplifying crop-loss claims with intelligent verification, evidence-based assessment, and transparent officer review. AI-powered crop insurance assistance for Indian farmers.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${instrumentSerif.variable} ${laila.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
