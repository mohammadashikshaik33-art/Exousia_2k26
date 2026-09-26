import type { Metadata } from "next";
import { Geist, Geist_Mono, Bebas_Neue, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import RouteTransition from "@/components/RouteTransition";
import LenisProvider from "@/components/LenisProvider";
import CustomCursor from "@/components/CustomCursor";
import ThreeBackground from "@/components/ThreeBackground";
import { EntranceProvider } from "@/context/EntranceContext";
import EntranceExperience from "@/components/EntranceExperience";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const bebasNeue = Bebas_Neue({
  variable: "--font-bebas-neue",
  weight: "400",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EXOUSIA 2026 | EEE Technical Festival",
  description: "When the current crosses over. Discover the state-level EEE technical festival EXOUSIA, inspired by electrical anomaly detection and phase inversion.",
  keywords: [
    "EXOUSIA",
    "EEE Festival",
    "Stranger Things Theme",
    "Electrical Engineering",
    "Phase Inversion",
    "State Level Technical Fest",
    "Electronics Event"
  ],
  authors: [{ name: "Electrical & Electronics Engineering Department" }],
  openGraph: {
    title: "EXOUSIA 2026 | EEE Technical Festival",
    description: "When the current crosses over. Join the anomalies at the state-level technical festival.",
    type: "website",
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${bebasNeue.variable} ${jetbrainsMono.variable} h-full antialiased dark scroll-smooth`}
      data-state="normal"
    >
      <body className="min-h-full flex flex-col bg-surface-container-lowest text-on-surface selection:bg-primary selection:text-on-primary overflow-x-hidden crt-overlay crt-flicker">
        <EntranceProvider>
          <LenisProvider>
            <ThreeBackground />
            <CustomCursor />
            <RouteTransition />
            <EntranceExperience />
            <div className="relative z-10 flex flex-col min-h-screen">
              {children}
            </div>
          </LenisProvider>
        </EntranceProvider>
      </body>
    </html>
  );
}
