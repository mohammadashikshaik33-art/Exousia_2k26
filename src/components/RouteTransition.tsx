"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function RouteTransition() {
  const pathname = usePathname();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [activePath, setActivePath] = useState(pathname);

  useEffect(() => {
    if (pathname !== activePath) {
      setIsTransitioning(true);
      const timer = setTimeout(() => {
        setActivePath(pathname);
        setIsTransitioning(false);
      }, 250); // Match CSS animation runtime (250ms)
      return () => clearTimeout(timer);
    }
  }, [pathname, activePath]);

  if (!isTransitioning) return null;

  return (
    <>
      {/* Moving Signal Phase Scanline */}
      <div className="route-scanline" />
      
      {/* Glitch Flash Screen Overlay */}
      <div className="fixed inset-0 bg-accent/2 pointer-events-none z-[99] animate-pulse duration-100" />
    </>
  );
}
