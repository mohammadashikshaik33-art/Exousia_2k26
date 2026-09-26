"use client";

import React, { useState } from "react";

export default function Teaser() {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <section id="teaser" className="py-20 border-b border-border relative z-30 transition-colors duration-500">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="space-y-2 mb-10 text-center">
          <span className="font-tech text-xs tracking-widest text-accent uppercase">[ BROADCAST WAVE ]</span>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl tracking-wider text-text-primary uppercase">
            OFFICIAL CINEMATIC TRAILER
          </h2>
          <p className="text-xs text-text-secondary max-w-md mx-auto">
            Witness the physical anomalies of the EEE blocks in high-definition signal streams.
          </p>
        </div>

        {/* Video Frame */}
        <div className="tech-border bg-bg-secondary aspect-video overflow-hidden relative shadow-accent-glow max-w-4xl mx-auto flex items-center justify-center font-mono">
          <div className="absolute inset-0 eee-grid pointer-events-none opacity-40"></div>
          
          {isPlaying ? (
            <iframe
              className="w-full h-full border-0 absolute inset-0 z-10"
              src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1" // Placeholder video link
              title="EXOUSIA Official Trailer"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="relative z-10 text-center flex flex-col items-center justify-center p-6 space-y-4">
              
              {/* Play Button Indicator */}
              <button 
                onClick={() => setIsPlaying(true)}
                className="w-16 h-16 sm:w-20 sm:h-20 border-2 border-accent text-accent hover:bg-accent hover:text-bg-primary transition-all duration-300 flex items-center justify-center shadow-accent-glow cursor-pointer group"
                aria-label="Play Trailer"
              >
                <svg className="h-6 w-6 sm:h-8 sm:w-8 fill-current ml-1 group-hover:scale-110 transition-transform duration-300" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </button>

              <span className="font-tech text-[10px] sm:text-xs text-text-secondary tracking-widest uppercase">
                LOAD CINEMATIC FEED (HD STREAM)
              </span>

            </div>
          )}

          {/* Technical Info overlays */}
          <div className="absolute top-3 left-4 font-mono text-[8px] sm:text-[9px] text-text-secondary tracking-widest z-0">
            FEED: ON_LINE // CAPTURE_RESOLUTION: 4K
          </div>
          <div className="absolute bottom-3 right-4 font-mono text-[8px] sm:text-[9px] text-text-secondary tracking-widest z-0">
            AUDIO: ACC_2CH // BITRATE: 12.8MBPS
          </div>

        </div>

      </div>
    </section>
  );
}
