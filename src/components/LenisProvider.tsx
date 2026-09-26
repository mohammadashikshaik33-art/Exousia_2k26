"use client";

import React, { useEffect, useRef } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Safely register ScrollTrigger
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function LenisProvider({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    // Disable smooth scroll on touch/mobile to prevent performance lag
    const isMobile = window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 1024;

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: !isMobile,
    });

    lenisRef.current = lenis;

    // Connect Lenis to ScrollTrigger
    const scrollHandler = () => {
      ScrollTrigger.update();
    };
    lenis.on("scroll", scrollHandler);

    // Bind GSAP ticker to Lenis animation frame updates
    const tickerCallback = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tickerCallback);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tickerCallback);
      lenis.off("scroll", scrollHandler);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
