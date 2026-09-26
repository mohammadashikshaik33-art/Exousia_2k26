import React, { Suspense } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import EventExplorer from "./EventExplorer";
import { getPublishedEvents } from "@/lib/data";

export const revalidate = 30; // Revalidate events index page every 30 seconds

export const metadata = {
  title: "Events Explorer | EXOUSIA 2026",
  description: "Browse the full EEE technical symposium catalog. Filter between technical hardware scrambles, spot signals oscillography, and fun logic escape games.",
};

export default async function EventsPage() {
  const events = await getPublishedEvents();

  return (
    <div className="flex flex-col min-h-screen relative bg-transparent text-text-primary">
      <Navbar />

      <main className="flex-grow pt-24 sm:pt-32 pb-16">
        <Suspense 
          fallback={
            <div className="max-w-7xl mx-auto px-4 text-center py-20">
              <span className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin inline-block"></span>
              <span className="block font-tech text-xs text-text-secondary tracking-widest uppercase mt-4">
                LOADING CORE FREQUENCIES...
              </span>
            </div>
          }
        >
          <EventExplorer events={events} />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}
