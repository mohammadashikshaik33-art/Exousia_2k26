"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Event } from "@/types";
import { MOCK_EVENTS } from "@/data/events";

interface Props {
  events?: Event[];
}

export default function Events({ events }: Props) {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const displayEvents = events || MOCK_EVENTS;

  // Map dynamic events to col-spans and icons to match the Stitch layout archetype
  const getCardLayoutProps = (index: number) => {
    switch (index % 3) {
      case 0:
        return {
          colSpan: "md:col-span-8",
          dayLabel: "DAY 01 / INITIATION",
          iconName: "science"
        };
      case 1:
        return {
          colSpan: "md:col-span-4",
          dayLabel: "ONGOING / CHALLENGE",
          iconName: "satellite_alt"
        };
      case 2:
      default:
        return {
          colSpan: "md:col-span-12",
          dayLabel: "DAY 02 / CULMINATION",
          iconName: "memory"
        };
    }
  };

  return (
    <section 
      id="events" 
      className="min-h-screen py-section-gap px-margin-mobile md:px-margin-desktop relative section-observe border-t border-outline-variant/10"
    >
      <div className="relative z-10 max-w-7xl mx-auto">
        <h2 className="font-display text-headline-lg-mobile md:text-headline-lg text-primary tracking-wider mb-12 bloom-glow uppercase">
          SYSTEM LOG: EVENTS
        </h2>

        {/* Dynamic Asymmetric Grid mapping Stitch layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
          {displayEvents.map((event, index) => {
            const layout = getCardLayoutProps(index);
            return (
              <div 
                key={event.id}
                onClick={() => setSelectedEvent(event)}
                className={`${layout.colSpan} bg-surface-container border border-outline-variant/30 p-8 hover:border-primary/50 hover:shadow-[0_0_20px_rgba(255,180,168,0.1)] transition-all duration-500 group relative overflow-hidden flex flex-col justify-between cursor-pointer`}
              >
                {/* Visual Icon overlay on top right */}
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity pointer-events-none">
                  <span className="material-symbols-outlined text-[100px] text-primary">
                    {layout.iconName}
                  </span>
                </div>

                <div className="relative z-10">
                  <h3 className="font-mono text-label-mono text-on-surface-variant tracking-widest mb-4 uppercase">
                    {layout.dayLabel} {"//"} EX-0{event.day}
                  </h3>
                  <h4 className="font-display text-headline-lg-mobile md:text-headline-lg text-on-surface mb-4 uppercase leading-none">
                    {event.title}
                  </h4>
                  <p className="font-sans text-body-md text-on-surface-variant mb-6 leading-relaxed">
                    {event.shortDescription || event.short_description}
                  </p>
                </div>

                <div className="relative z-10 flex justify-between items-center mt-6 border-t border-outline-variant/20 pt-4">
                  <span className="font-mono text-[10px] text-on-surface-variant uppercase">
                    CREW_CAP: {event.teamSize} {"//"} VENUE: {event.venue || "LAB_01"}
                  </span>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedEvent(event);
                    }}
                    className="text-primary font-mono text-label-mono hover:text-white transition-colors flex items-center gap-2 uppercase text-xs cursor-pointer"
                  >
                    ACCESS DETAILS 
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dynamic Detail Modal Drawer */}
      {selectedEvent && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={() => setSelectedEvent(null)}
        >
          <div 
            className="bg-surface-container border border-outline-variant/60 w-full max-w-xl p-6 sm:p-8 space-y-6 relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            style={{ borderRadius: "0px" }}
          >
            {/* Close trigger */}
            <button
              onClick={() => setSelectedEvent(null)}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-primary font-mono text-xs transition-colors cursor-pointer"
            >
              [ ESC // CLOSE ]
            </button>

            {/* Header info */}
            <div className="space-y-1">
              <span className="px-2 py-0.5 border border-primary/20 bg-primary/5 text-[9px] font-mono text-primary uppercase tracking-widest">
                {selectedEvent.category} {"//"} DAY 0{selectedEvent.day}
              </span>
              <h3 className="font-display font-extrabold text-2xl tracking-wider text-on-surface uppercase pt-2 leading-none">
                {selectedEvent.title}
              </h3>
            </div>

            {/* Specifications Matrix */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-surface-container-lowest p-4 border border-outline-variant/30 font-mono text-[10px]">
              <div>
                <span className="text-on-surface-variant/60 block">REPORT TIME</span>
                <span className="text-on-surface font-bold">{selectedEvent.time}</span>
              </div>
              <div>
                <span className="text-on-surface-variant/60 block">TARGET VENUE</span>
                <span className="text-on-surface font-bold line-clamp-1">{selectedEvent.venue}</span>
              </div>
              <div>
                <span className="text-on-surface-variant/60 block">CREW LIMIT</span>
                <span className="text-on-surface font-bold">{selectedEvent.teamSize} SUBJECTS</span>
              </div>
              <div>
                <span className="text-on-surface-variant/60 block">GATEWAY STATUS</span>
                <span className="text-primary font-bold uppercase">{selectedEvent.registrationStatus || "ACTIVE"}</span>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <span className="font-mono text-xs tracking-wider text-on-surface uppercase block">[ ANOMALY SYNOPSIS ]</span>
              <p className="text-on-surface-variant text-xs sm:text-sm leading-relaxed">{selectedEvent.description}</p>
            </div>

            {/* Protocols / Rules */}
            {selectedEvent.rules && selectedEvent.rules.length > 0 && (
              <div className="space-y-2">
                <span className="font-mono text-xs tracking-wider text-on-surface uppercase block">[ CONTAINMENT PROTOCOLS ]</span>
                <ul className="list-disc pl-4 space-y-1.5 text-xs text-on-surface-variant leading-relaxed">
                  {selectedEvent.rules.map((rule, idx) => (
                    <li key={idx}>{rule}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Contact wave channels */}
            {selectedEvent.coordinators && selectedEvent.coordinators.length > 0 && (
              <div className="space-y-2 border-t border-outline-variant/20 pt-4">
                <span className="font-mono text-[10px] tracking-wider text-on-surface uppercase block">[ COMMAND CONTACTS ]</span>
                <div className="flex flex-wrap gap-4 text-xs font-mono">
                  {selectedEvent.coordinators.map((c, idx) => (
                    <div key={idx} className="text-on-surface-variant">
                      {c.name}: <span className="text-primary">{c.phone}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="pt-4 flex flex-wrap justify-end gap-3 border-t border-outline-variant/20">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-5 py-2 bg-surface-container-low border border-outline-variant/40 hover:border-primary hover:text-primary font-mono text-xs uppercase tracking-wider transition-all duration-300 cursor-pointer"
              >
                CLOSE
              </button>
              <Link
                href={`/events/${selectedEvent.slug}`}
                onClick={() => setSelectedEvent(null)}
                className="px-5 py-2 bg-transparent border border-primary text-primary hover:bg-primary/10 font-mono text-xs uppercase tracking-wider transition-all duration-300 cursor-pointer"
              >
                FULL FILE
              </Link>
              <Link
                href={`/register?event=${selectedEvent.slug}`}
                onClick={() => setSelectedEvent(null)}
                className="px-5 py-2 bg-primary text-on-primary font-mono font-bold text-xs uppercase tracking-wider transition-all duration-300 cursor-pointer"
              >
                SECURE CREDENTIALS
              </Link>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
