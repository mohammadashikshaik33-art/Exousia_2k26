import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getEventBySlug, getPublishedEvents } from "@/lib/data";
import CapacityInstrument from "@/components/CapacityInstrument";

interface Props {
  params: Promise<{ slug: string }>;
}

export const revalidate = 30; // Revalidate event detail sheets every 30 seconds

// Pre-render static routes for all active events in the database
export async function generateStaticParams() {
  const events = await getPublishedEvents();
  return events.map((e) => ({
    slug: e.slug,
  }));
}

// Dynamic SEO metadata generation
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  const event = await getEventBySlug(slug);

  if (!event) {
    return {
      title: "Event Specification Not Found | EXOUSIA 2026",
    };
  }

  return {
    title: `${event.title} - Specs // EXOUSIA 2026`,
    description: `${event.short_description} View rules, schedules, venue details, and registration forms for ${event.title}.`,
    openGraph: {
      title: `${event.title} | EXOUSIA 2026`,
      description: event.short_description,
      type: "website",
    },
  };
}

export default async function EventDetailPage({ params }: Props) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;

  const event = await getEventBySlug(slug);

  if (!event) {
    return (
      <div className="flex flex-col min-h-screen relative bg-transparent text-text-primary">
        <Navbar />
        <main className="flex-grow flex flex-col items-center justify-center pt-24 pb-16 px-4">
          <span className="font-tech text-xs tracking-widest text-accent uppercase mb-2">
            [ ERROR 404 // SIGNAL COLLAPSED ]
          </span>
          <h1 className="font-display font-extrabold text-3xl tracking-wide uppercase mb-4 text-center">
            SPECIFICATION_NOT_FOUND
          </h1>
          <p className="text-xs text-text-secondary text-center max-w-sm mb-6 leading-relaxed">
            The requested technical event schematic could not be located in the EEE festival records database.
          </p>
          <Link
            href="/events"
            className="px-5 py-2 rounded border border-accent text-accent hover:bg-accent/10 font-tech text-xs tracking-wider transition-all duration-300"
          >
            RETURN TO DIRECTORY
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen relative bg-transparent text-text-primary">
      <Navbar />

      <main className="flex-grow pt-24 sm:pt-32 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full z-20">
        
        {/* Breadcrumbs */}
        <div className="mb-6 font-mono text-[9px] text-text-secondary flex items-center gap-1.5 uppercase">
          <Link href="/" className="hover:text-accent">HOME</Link>
          <span>/</span>
          <Link href="/events" className="hover:text-accent">EVENTS</Link>
          <span>/</span>
          <span className="text-accent">{event.title}</span>
        </div>

        {/* Dynamic Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Column: Details Summary */}
          <div className="lg:col-span-8 space-y-8">
            {/* Document Dossier Header */}
            <div className="flex justify-between items-start border-b-2 border-border pb-4 mb-6">
              <div>
                <span className="font-tech text-[10px] tracking-[0.25em] text-accent block uppercase mb-1">
                  {"// DEPT_ARCHIVE // INCIDENT_RECORD"}
                </span>
                <h1 className="font-display font-extrabold text-3xl sm:text-4xl tracking-wide text-text-primary uppercase">
                  {event.title}
                </h1>
                <p className="font-mono text-[9px] text-text-secondary uppercase mt-1">
                  DOSSIER REFERENCE ID: CASE-{event.id.substring(0, 8).toUpperCase()}
                </p>
              </div>
              <div className="classified-stamp ml-4 hidden sm:block">
                CLASSIFIED
              </div>
            </div>

            {/* Objective Panel */}
            <div className="p-4 border-l-2 border-accent bg-bg-secondary/40">
              <span className="font-tech text-[9px] text-accent tracking-widest block mb-1">
                {"// COGNITIVE_OBJECTIVE"}
              </span>
              <p className="text-xs sm:text-sm text-text-secondary font-mono leading-relaxed">
                {event.objective}
              </p>
            </div>

            {/* Synopsis */}
            <div className="space-y-3">
              <h2 className="font-display font-bold text-md text-text-primary uppercase border-b border-border/40 pb-1">
                EVENT SYNOPSIS
              </h2>
              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed font-mono">
                {event.full_description}
              </p>
            </div>

            {/* Rules */}
            <div className="space-y-4">
              <h2 className="font-display font-bold text-md text-text-primary uppercase border-b border-border/40 pb-1">
                SYSTEM PROTOCOLS &amp; RULES
              </h2>
              <ol className="list-decimal pl-5 space-y-2 text-xs sm:text-sm text-text-secondary leading-relaxed font-mono">
                {event.rules.map((rule, idx) => (
                  <li key={idx}>{rule}</li>
                ))}
              </ol>
            </div>

            {/* Judging Criteria */}
            {event.judging_criteria && event.judging_criteria.length > 0 && (
              <div className="space-y-4">
                <h2 className="font-display font-bold text-md text-text-primary uppercase border-b border-border/40 pb-1">
                  EVALUATION METRICS
                </h2>
                <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-text-secondary leading-relaxed font-mono">
                  {event.judging_criteria.map((criteria, idx) => (
                    <li key={idx}>{criteria}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Right Column: Spec Sheet Sidebar */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-28">
            <div className="tech-border bg-bg-secondary/80 backdrop-blur-sm p-6 shadow-accent-glow">
              
              <div className="mb-6">
                <CapacityInstrument capacity={event.capacity || 75} />
              </div>

              <span className="font-tech text-[10px] text-accent tracking-widest block mb-4 uppercase">
                [ SPECIFICATIONS_SHEET ]
              </span>

              <div className="space-y-4 font-mono text-[10px] text-text-secondary border-b border-border/40 pb-4 mb-4">
                <div className="flex justify-between border-b border-border/20 pb-2">
                  <span>TIME FRAME</span>
                  <span className="text-text-primary">{event.time}</span>
                </div>
                <div className="flex justify-between border-b border-border/20 pb-2">
                  <span>DATE CYCLE</span>
                  <span className="text-text-primary">{event.date}</span>
                </div>
                <div className="flex justify-between border-b border-border/20 pb-2">
                  <span>LAB LOCATION</span>
                  <span className="text-accent hover:underline">
                    <Link href="/campus">{event.venue}</Link>
                  </span>
                </div>
                <div className="flex justify-between border-b border-border/20 pb-2">
                  <span>CAPACITY CAP</span>
                  <span className="text-text-primary">{event.capacity} TEAMS max</span>
                </div>
                <div className="flex justify-between border-b border-border/20 pb-2">
                  <span>TEAM FORMAT</span>
                  <span className="text-text-primary">{event.teamSize}</span>
                </div>
                <div className="flex justify-between border-b border-border/20 pb-2">
                  <span>REWARDS LABEL</span>
                  <span className="text-text-primary">{event.prize_label}</span>
                </div>
                <div className="flex justify-between">
                  <span>GATEWAY FEE</span>
                  <span className="text-accent uppercase font-bold text-shadow-accent">FREE ENTRY</span>
                </div>
              </div>

              {/* Coordinators Contact Details */}
              <div className="space-y-3 mb-6">
                <span className="font-tech text-[9px] text-text-tertiary tracking-widest block uppercase">
                  {"// COIL_COORDINATORS"}
                </span>
                {event.coordinators.map((c, idx) => (
                  <div key={idx} className="p-2 border border-border bg-bg-tertiary/50 flex justify-between items-center">
                    <div>
                      <div className="font-display text-[10px] text-text-primary font-bold">{c.name}</div>
                      <div className="text-[8px] text-text-tertiary font-mono">{c.role || "Coordinator"}</div>
                    </div>
                    <a 
                      href={`tel:${c.phone}`}
                      className="font-mono text-[9px] text-accent hover:underline hover:text-shadow-accent active:scale-95"
                    >
                      {c.phone}
                    </a>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <Link
                  href={`/register?event=${event.slug}`}
                  data-cursor="magnet"
                  data-cursor-label="SECURE"
                  className="w-full py-2.5 bg-accent/15 border border-accent text-accent text-center block font-tech font-bold text-xs tracking-widest hover:bg-accent/25 hover:shadow-accent-glow transition-all duration-300 cursor-pointer"
                >
                  [ SECURE ENTRY SLOT ]
                </Link>
                <Link
                  href="/events"
                  data-cursor="magnet"
                  data-cursor-label="RETURN"
                  className="w-full py-2.5 bg-transparent border border-border text-text-primary text-center block font-tech text-xs tracking-widest hover:border-accent hover:text-accent transition-all duration-300"
                >
                  [ BACK TO CATALOGUE ]
                </Link>
              </div>
            </div>
          </div>

        </div>

      </main>

      <Footer />
    </div>
  );
}
