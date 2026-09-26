import React from "react";
import Countdown from "@/components/Countdown";
import { FESTIVAL_INFO } from "@/data/events";

export default function EventInfo() {
  return (
    <section className="py-12 border-y border-border bg-bg-secondary/40 relative z-30 transition-colors duration-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Key Readings Grid */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-6 font-tech text-center sm:text-left">
            
            {/* Date Block */}
            <div className="space-y-1 border-l-2 border-accent pl-4 text-left">
              <span className="block text-[10px] text-text-secondary tracking-widest">01 / EVENT DATES</span>
              <span className="block text-lg font-bold text-text-primary uppercase tracking-wider">{FESTIVAL_INFO.dates.formatted}</span>
              <span className="block text-[10px] text-text-secondary">2-Day Core Symposium</span>
            </div>

            {/* Location Block */}
            <div className="space-y-1 border-l-2 border-accent pl-4 text-left">
              <span className="block text-[10px] text-text-secondary tracking-widest">02 / VENUE</span>
              <span className="block text-lg font-bold text-text-primary uppercase tracking-wider">{FESTIVAL_INFO.location.name}</span>
              <span className="block text-[10px] text-text-secondary">Coords: {FESTIVAL_INFO.location.coordinates}</span>
            </div>

            {/* Status Block */}
            <div className="space-y-1 border-l-2 border-accent pl-4 text-left">
              <span className="block text-[10px] text-text-secondary tracking-widest">03 / GATEWAY STATUS</span>
              <span className="block text-lg font-bold text-accent text-shadow-accent uppercase tracking-wider">REGISTRATION OPEN</span>
              <span className="block text-[10px] text-text-secondary">Capacities Restricted per Event</span>
            </div>

          </div>

          {/* Live Countdown Grid */}
          <div className="lg:col-span-5 flex flex-col justify-center space-y-3">
            <div className="text-center lg:text-right font-tech text-[10px] text-text-secondary tracking-widest uppercase mb-1">
              SYS T-MINUS TO PHASE ALIGNMENT
            </div>
            <Countdown />
          </div>

        </div>
      </div>
    </section>
  );
}
