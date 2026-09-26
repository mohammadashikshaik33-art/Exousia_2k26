"use client";

import React, { useEffect } from "react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log exception to operations monitoring stream
    console.error("[EXOUSIA Microgrid Exception]:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-black text-red-500 font-mono relative overflow-hidden">
      
      {/* Cinematic Grid & CRT Scanline Background */}
      <div className="absolute inset-0 eee-grid pointer-events-none opacity-20"></div>
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-red-500/5 to-transparent animate-pulse-slow"></div>

      <div className="max-w-md w-full p-6 border-2 border-red-500/60 bg-red-950/15 backdrop-blur-md shadow-[0_0_20px_rgba(239,68,68,0.2)] relative z-10 text-center space-y-6 animate-fade-in">
        
        {/* Terminal Header */}
        <div className="border-b border-red-500/30 pb-4 text-left">
          <span className="font-tech text-xs tracking-widest uppercase block animate-pulse">
            [ ALERT // EXOUSIA CORE SHUTDOWN ]
          </span>
          <span className="text-[9px] text-red-500/50 uppercase mt-0.5 block">
            ERROR_DIGEST: {error.digest || "UNKNOWN_TELEMETRY"}
          </span>
        </div>

        {/* Anomaly Graphic */}
        <div className="py-2 flex justify-center">
          <div className="w-16 h-16 border border-red-500 flex items-center justify-center animate-pulse">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </div>

        {/* Explanatory telemetry */}
        <div className="space-y-2">
          <h2 className="font-display font-extrabold text-xl tracking-wider uppercase text-white">
            SYSTEM_COLLAPSE_DETECTED
          </h2>
          <p className="text-xs text-red-500/80 leading-relaxed font-mono max-w-xs mx-auto">
            An unexpected transient current has disrupted the database or rendering microgrid. Check connections or re-initialize.
          </p>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            onClick={() => reset()}
            className="w-full py-2.5 border border-red-500 bg-red-500/10 text-red-500 font-tech font-bold text-xs tracking-widest transition-all duration-300 hover:bg-red-500/25 shadow-[0_0_15px_rgba(239,68,68,0.3)] cursor-pointer"
          >
            [ RECALIBRATE SYSTEM NODE ]
          </button>
        </div>

        <div className="text-[8px] text-red-500/30 uppercase">
          DEPARTMENT OF ELECTRICAL &amp; ELECTRONICS ENGINEERING // EXOUSIA 2026
        </div>
      </div>
    </div>
  );
}
