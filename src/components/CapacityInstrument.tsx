"use client";

import React, { useRef, useEffect, useState } from "react";
import gsap from "gsap";

export default function CapacityInstrument({ capacity = 80 }: { capacity?: number }) {
  const barRef = useRef<HTMLDivElement>(null);
  const [currentVal, setCurrentVal] = useState(0);

  useEffect(() => {
    if (barRef.current) {
      const obj = { val: 0 };
      gsap.to(obj, {
        val: capacity,
        duration: 1.1,
        ease: "power2.out",
        onUpdate: () => {
          setCurrentVal(Math.round(obj.val));
          if (barRef.current) {
            barRef.current.style.width = `${obj.val}%`;
          }
        },
      });
    }
  }, [capacity]);

  const totalBlocks = 18;
  const activeBlocks = Math.round((currentVal / 100) * totalBlocks);
  const blockString = "█".repeat(activeBlocks) + "░".repeat(totalBlocks - activeBlocks);

  return (
    <div className="border border-border/40 p-4 bg-black/45 font-mono text-[10px] space-y-3">
      <div className="flex justify-between items-center text-text-tertiary">
        <span className="font-tech text-[8px] tracking-wider">APPARATUS_LOAD_CAPACITY</span>
        <span className="font-mono text-accent font-bold">STATUS: ACTIVE</span>
      </div>

      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <div className="text-[12px] font-bold text-text-primary tracking-widest leading-none">
            {currentVal} / 100 SLOTS
          </div>
          <div className="text-[8px] text-text-tertiary uppercase">
            GRID PRESSURE: {currentVal}% LOADED
          </div>
        </div>
        <div className="font-tech text-accent text-lg leading-none animate-pulse">
          {currentVal}%
        </div>
      </div>

      {/* Physical typewriter block visual and loader */}
      <div className="space-y-1.5 pt-1">
        <div className="text-[9px] text-accent tracking-widest font-tech font-bold leading-none select-none">
          {blockString}
        </div>
        <div className="w-full h-1 bg-bg-tertiary border border-border/20">
          <div ref={barRef} className="h-full bg-accent" style={{ width: "0%" }} />
        </div>
      </div>
    </div>
  );
}
