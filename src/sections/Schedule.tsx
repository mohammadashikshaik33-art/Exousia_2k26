"use client";

import React, { useState } from "react";
import { MOCK_EVENTS, FESTIVAL_INFO } from "@/data/events";

export default function Schedule() {
  const [activeDay, setActiveDay] = useState<1 | 2>(1);

  const dayEvents = MOCK_EVENTS.filter((e) => e.day === activeDay).sort((a, b) => {
    // Basic sorting (could parse actual times if needed, but since it's mock data we sort by time string/id)
    return a.time.localeCompare(b.time);
  });

  return (
    <section id="schedule" className="py-20 border-b border-border relative z-30 transition-colors duration-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-2">
            <span className="font-tech text-xs tracking-widest text-accent uppercase">[ TEMPORAL SEQUENCER ]</span>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl tracking-wider text-text-primary uppercase">
              SYMPOSIUM SCHEDULE
            </h2>
          </div>

          {/* Day Toggles */}
          <div className="flex gap-2 font-tech text-xs">
            <button
              onClick={() => setActiveDay(1)}
              className={`px-6 py-2.5 border transition-all duration-300 uppercase tracking-widest cursor-pointer ${
                activeDay === 1
                  ? "bg-accent/15 text-accent border-accent font-bold shadow-accent-glow"
                  : "bg-bg-secondary border-border text-text-secondary hover:border-accent hover:bg-bg-tertiary"
              }`}
            >
              DAY 01 // {FESTIVAL_INFO.dates.day1.split(",")[0]}
            </button>
            <button
              onClick={() => setActiveDay(2)}
              className={`px-6 py-2.5 border transition-all duration-300 uppercase tracking-widest cursor-pointer ${
                activeDay === 2
                  ? "bg-accent/15 text-accent border-accent font-bold shadow-accent-glow"
                  : "bg-bg-secondary border-border text-text-secondary hover:border-accent hover:bg-bg-tertiary"
              }`}
            >
              DAY 02 // {FESTIVAL_INFO.dates.day2.split(",")[0]}
            </button>
          </div>
        </div>

        {/* Timeline Sequence Board */}
        <div className="tech-border bg-bg-secondary/20 backdrop-blur-sm p-6 sm:p-8 space-y-6">
          <div className="hidden sm:grid grid-cols-12 gap-4 pb-4 border-b border-border text-text-secondary font-tech text-[10px] tracking-widest uppercase">
            <div className="col-span-2">TIME LINE</div>
            <div className="col-span-4">EVENT DESCRIPTION</div>
            <div className="col-span-3">VENUE APPARATUS</div>
            <div className="col-span-2">SPECS</div>
            <div className="col-span-1 text-right">GATE</div>
          </div>

          <div className="space-y-4">
            {dayEvents.length > 0 ? (
              dayEvents.map((event) => (
                <div 
                  key={event.id}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 items-center py-4 border-b border-border/40 last:border-0 hover:bg-bg-tertiary/20 px-2 transition-colors duration-200"
                >
                  {/* Time */}
                  <div className="col-span-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-accent inline-block"></span>
                    <span className="font-tech text-xs sm:text-sm font-bold text-accent text-shadow-accent">
                      {event.time.split(" (")[0]}
                    </span>
                  </div>

                  {/* Title & Category info */}
                  <div className="col-span-4 space-y-1">
                    <h4 className="font-display font-semibold text-sm sm:text-base text-text-primary uppercase">
                      {event.title}
                    </h4>
                    <span className="inline-block px-1.5 py-0.5 border border-border text-[8px] font-mono text-text-secondary uppercase">
                      {event.category}
                    </span>
                  </div>

                  {/* Venue */}
                  <div className="col-span-3 text-xs font-mono text-text-secondary">
                    {event.venue}
                  </div>

                  {/* Group / Team info */}
                  <div className="col-span-2 text-xs font-tech text-text-tertiary">
                    {event.teamSize}
                  </div>

                  {/* Status & CTA link */}
                  <div className="col-span-1 text-left sm:text-right">
                    <a
                      href="#events"
                      className="inline-block text-[10px] font-tech text-accent hover:underline uppercase tracking-wider"
                    >
                      [ INFO ]
                    </a>
                  </div>

                </div>
              ))
            ) : (
              <div className="py-12 text-center text-text-secondary font-tech text-xs tracking-widest uppercase">
                NO SECTOR SCHEDULINGS REPORTED FOR THIS CYCLE.
              </div>
            )}
          </div>
        </div>

      </div>
    </section>
  );
}
