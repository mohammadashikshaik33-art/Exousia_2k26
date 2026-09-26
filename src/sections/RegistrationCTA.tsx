"use client";

import React from "react";
import Link from "next/link";

export default function RegistrationCTA() {
  return (
    <section 
      id="register" 
      className="min-h-[50vh] flex items-center justify-center py-section-gap px-margin-mobile md:px-margin-desktop relative section-observe border-t border-outline-variant/20"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-primary/5 pointer-events-none" />
      
      <div className="relative z-10 text-center w-full max-w-3xl">
        <h2 
          className="font-display text-headline-xl md:text-[100px] text-primary tracking-widest mb-6 glitch-text bloom-glow uppercase"
          data-text="INITIALIZE"
        >
          INITIALIZE
        </h2>
        
        <p className="font-sans text-body-lg text-on-surface-variant mb-10">
          Secure your access parameters. Capacity is strictly regulated.
        </p>
        
        <Link 
          href="/register"
          className="inline-block bg-primary/10 border-2 border-primary text-primary px-12 py-5 font-display text-2xl uppercase tracking-widest hover:bg-primary hover:text-on-primary hover:shadow-[0_0_30px_rgba(255,180,168,0.6)] transition-all duration-500 group relative overflow-hidden cursor-pointer"
        >
          <span className="relative z-10 flex items-center gap-3 justify-center">
            SECURE CREDENTIALS 
            <span className="material-symbols-outlined group-hover:translate-x-2 transition-transform">
              arrow_forward
            </span>
          </span>
        </Link>
      </div>
    </section>
  );
}
