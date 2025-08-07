import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs';
import "./globals.css";
import RateLimitBanner from "@/components/RateLimitBanner";
import AuthBanner from "@/components/AuthBanner";
import SessionProvider from "@/components/SessionProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TalentWise - HR Management Platform",
  description: "Intelligent HR assistance powered by AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <SessionProvider>
            {/* Auth prompt banner for unsigned users */}
            <AuthBanner />

            {/* Global rate-limit banner */}
            {/* Placed here so it renders on every page without manual inclusion */}
            {/* eslint-disable-next-line @next/next/no-sync-scripts */}
            <RateLimitBanner />
            {children}
          </SessionProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}