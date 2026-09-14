import type { Metadata } from "next";
import { DM_Sans, Inter } from "next/font/google";
import { defaultSiteConfig } from "@/frontend/config/defaults";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter"
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-display"
});

export const metadata: Metadata = {
  title: defaultSiteConfig.seo.metaTitle,
  description: defaultSiteConfig.seo.metaDescription
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${dmSans.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
