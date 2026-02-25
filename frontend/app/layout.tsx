// You are helping build an AI Product Decision Platform. Never add generic charts or infra metrics. All outputs must directly support: what is broken, why, and what to fix first for an AI SaaS product.

import type { Metadata } from "next";
import { Syne, Inter } from "next/font/google";
import "./globals.css";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  display: "swap",
});
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://example.com";
const bingVerification = process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "AI Product Decision Platform",
    template: "%s — AI Product Decision Platform",
  },
  description: "What's broken, why, and what to fix this week — for your AI product. Decision Cards and weekly reports for early-stage AI SaaS.",
  keywords: [
    "AI product decisions",
    "what to fix this week",
    "AI feedback analysis",
    "Decision Cards",
    "AI SaaS",
    "product prioritization",
    "user feedback AI",
    "weekly product report",
    "AI product management",
    "fix AI product",
  ],
  authors: [{ name: "AI Product Decision Platform" }],
  creator: "AI Product Decision Platform",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "AI Product Decision Platform",
    title: "AI Product Decision Platform — What to fix this week",
    description: "What's broken, why, and what to fix this week. Decision Cards and weekly reports for your AI product.",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Product Decision Platform",
    description: "What's broken, why, and what to fix this week — for your AI product.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  ...(bingVerification
    ? { verification: { other: { "msvalidate.01": bingVerification } } }
    : {}),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${syne.variable} ${inter.variable}`}>
      <body className="font-body">{children}</body>
    </html>
  );
}
