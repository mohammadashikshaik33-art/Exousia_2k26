import React from "react";
import { MOCK_EVENTS } from "@/data/events";

export default function PosterShowcase() {
  return (
    <section id="posters" className="py-20 border-b border-border relative z-30 transition-colors duration-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="space-y-2 mb-12 text-center lg:text-left">
          <span className="font-tech text-xs tracking-widest text-accent uppercase">[ GRAPHICAL EMISSIONS ]</span>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl tracking-wider text-text-primary uppercase">
            POSTER SHOWCASE
          </h2>
          <p className="text-xs text-text-secondary max-w-md">
            Scan and download official event blueprints and promotional broadcasts.
          </p>
        </div>

        {/* Horizontal Scroll Track */}
        <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-accent scroll-smooth snap-x snap-mandatory font-mono">
          {MOCK_EVENTS.map((event) => (
            <div 
              key={event.id}
              className="flex-shrink-0 w-72 aspect-[3/4] tech-border bg-bg-secondary p-4 flex flex-col justify-between snap-start hover:border-accent hover:shadow-accent-glow transition-all duration-300 group"
            >
              {/* Poster Art Placeholder */}
              <div className="flex-1 w-full bg-black/60 border border-border relative overflow-hidden flex flex-col items-center justify-center text-center p-4">
                {/* Fine grid */}
                <div className="absolute inset-0 eee-grid-fine opacity-20 pointer-events-none"></div>
                
                {/* Visual symbol placeholder */}
                <div className="w-10 h-10 border border-accent/20 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:border-accent transition-transform duration-300">
                  <span className="font-tech text-xs text-accent">Ω</span>
                </div>

                <div className="font-display font-bold text-sm text-text-primary group-hover:text-accent tracking-widest uppercase">
                  {event.title}
                </div>
                <div className="font-tech text-[9px] text-text-secondary tracking-widest mt-1">
                  EXOUSIA &apos;26 // EEE
                </div>
              </div>

              {/* Poster info */}
              <div className="pt-4 flex justify-between items-center text-[10px] font-mono text-text-secondary">
                <span className="font-tech uppercase text-accent">{event.category}</span>
                <span>[ RES_1080x1350 ]</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
