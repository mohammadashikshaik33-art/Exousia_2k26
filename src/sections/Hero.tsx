"use client";

import React, { useEffect, useState } from "react";
import { useEntrance } from "@/context/EntranceContext";

export default function Hero() {
  const { state } = useEntrance();
  const [isSettled, setIsSettled] = useState(false);
  const [subtitleVisible, setSubtitleVisible] = useState(false);

  useEffect(() => {
    if (state === "unlocked") {
      const timer1 = setTimeout(() => {
        setIsSettled(true);
        const timer2 = setTimeout(() => {
          setSubtitleVisible(true);
        }, 800);
        return () => clearTimeout(timer2);
      }, 100);
      return () => clearTimeout(timer1);
    }
  }, [state]);

  const handleScrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section 
      id="home" 
      className="min-h-screen relative flex flex-col justify-center items-center px-margin-mobile md:px-margin-desktop pt-24 overflow-hidden section-observe"
    >
      {/* Background container with Stitch Brutalist facility image */}
      <div className="absolute inset-0 z-0 select-none pointer-events-none">
        <div 
          className="w-full h-full bg-cover bg-center opacity-30 mix-blend-luminosity" 
          style={{ 
            backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCCkDXlXb8zvQJeQArJQHk4t9FppnXUfsUOTyhFqIkBOmtYsNsBce-aHQuzgqjSYEDAgtdtj2SXSKXsktmwkWEIMLN_loCknqvcKoG7rKP6NZ8rTnnXM7gtwrlc7WRywViGP6s-4jEPNyl69Qd8lu_LuVX-cQEgbzzGJ3fQsj0z5cPEzCNQdrmoSUk4wiaKn0TYZoffDQPeOIWu1ZURhAITt1LZw8W7hEsHiFcK_GGbDAlHlGHZGLk')" 
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-surface-container-lowest/80 to-transparent" />
      </div>

      {/* Main hero title content */}
      <div className="z-10 text-center relative w-full flex flex-col items-center select-none">
        <h1 
          id="hero-title" 
          className={`font-display text-headline-xl md:text-[150px] md:leading-[140px] text-primary tracking-[0.15em] font-bold glitch-text hero-title-drop bloom-glow ${
            isSettled ? "hero-title-settled" : ""
          }`}
          data-text="EXOUSIA"
        >
          EXOUSIA
        </h1>

        <div 
          id="hero-subtitle" 
          style={{
            opacity: subtitleVisible ? 1 : 0,
            transform: subtitleVisible ? "translateY(0)" : "translateY(16px)",
            transition: "opacity 1s ease-out, transform 1s ease-out"
          }}
          className="mt-8 max-w-2xl mx-auto"
        >
          <p className="font-sans text-body-md md:text-body-lg text-on-surface-variant font-light mb-8 leading-relaxed">
            System integrity compromised. Anomaly detection active. Terminal access granted to sector 7G.
          </p>
          <div className="flex gap-4 justify-center">
            <button 
              className="border border-primary text-primary px-8 py-3 font-mono text-label-mono uppercase hover:bg-primary/10 hover:shadow-[0_0_15px_rgba(255,180,168,0.3)] transition-all duration-300 relative overflow-hidden group cursor-pointer"
              onClick={() => handleScrollTo("events")}
            >
              <span className="relative z-10 group-hover:animate-pulse">EXPLORE EVENTS</span>
            </button>
            <button 
              className="border border-outline-variant text-on-surface-variant px-8 py-3 font-mono text-label-mono uppercase hover:bg-outline-variant/20 hover:text-on-surface transition-all duration-300 cursor-pointer"
              onClick={() => handleScrollTo("register")}
            >
              REGISTER
            </button>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center opacity-50 animate-pulse select-none pointer-events-none">
        <span className="font-mono text-[10px] text-primary mb-2 tracking-widest">SCROLL TO DESCEND</span>
        <span className="material-symbols-outlined text-primary">arrow_downward</span>
      </div>
    </section>
  );
}
