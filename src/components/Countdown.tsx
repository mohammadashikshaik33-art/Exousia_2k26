"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import React, { useState, useEffect } from "react";
import { FESTIVAL_INFO } from "@/data/events";

interface Props {
  targetDate?: string;
}

export default function Countdown({ targetDate }: Props) {
  const [mounted, setMounted] = useState(false);
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    completed: false
  });

  useEffect(() => {
    setMounted(true);

    const calculateTime = () => {
      const deadlineStr = targetDate || FESTIVAL_INFO.registration_deadline;
      const target = new Date(deadlineStr).getTime();
      const now = new Date().getTime();
      const difference = target - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, completed: true });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, completed: false });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  const formatNumber = (num: number) => {
    return num.toString().padStart(2, "0");
  };

  const timeBlocks = [
    { label: "DAYS", value: timeLeft.days },
    { label: "HOURS", value: timeLeft.hours },
    { label: "MINS", value: timeLeft.minutes },
    { label: "SECS", value: timeLeft.seconds }
  ];

  return (
    <div className="w-full py-8 border-b border-border bg-bg-primary/20 relative z-30 flex flex-col items-center justify-center">
      <div className="max-w-xl text-center space-y-4">
        
        <span className="font-tech text-xs tracking-[0.25em] text-accent uppercase block">
          [ REGISTRATION_DEADLINE_TIMER ]
        </span>

        {/* Counter Displays */}
        <div className="flex gap-4 sm:gap-6 justify-center items-center">
          {timeBlocks.map((block) => (
            <div key={block.label} className="flex flex-col items-center">
              <div className="w-16 sm:w-20 aspect-square tech-border bg-bg-secondary flex items-center justify-center shadow-sm">
                <span className="font-display font-extrabold text-2xl sm:text-3xl text-text-primary tracking-wider">
                  {mounted ? formatNumber(block.value) : "00"}
                </span>
              </div>
              <span className="font-tech text-[9px] text-text-tertiary mt-2 tracking-widest">
                {block.label}
              </span>
            </div>
          ))}
        </div>

        {timeLeft.completed && mounted && (
          <div className="text-[10px] font-mono text-red-500 uppercase tracking-widest animate-pulse mt-2">
            WARNING: REGISTRATION WINDOW CLOSED // APPARATUS COLLAPSED
          </div>
        )}

      </div>
    </div>
  );
}
