"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type EntranceState = 
  | "darkness" 
  | "acquiring" 
  | "anomaly" 
  | "reveal" 
  | "telemetry" 
  | "circuit" 
  | "unlocked";

interface EntranceContextProps {
  state: EntranceState;
  setState: (state: EntranceState) => void;
  closeCircuit: () => void;
}

const EntranceContext = createContext<EntranceContextProps | undefined>(undefined);

export function EntranceProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<EntranceState>("darkness");

  const closeCircuit = () => {
    setState("unlocked");
    if (typeof window !== "undefined") {
      sessionStorage.setItem("exousia_unlocked", "true");
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isUnlocked = sessionStorage.getItem("exousia_unlocked") === "true";
      if (isUnlocked) {
        const t = setTimeout(() => {
          setState("unlocked");
        }, 0);
        return () => clearTimeout(t);
      }
    }

    const timeline = [
      { state: "darkness", delay: 1800 },
      { state: "acquiring", delay: 2000 },
      { state: "anomaly", delay: 2000 },
      { state: "reveal", delay: 2200 },
      { state: "telemetry", delay: 1600 },
      { state: "circuit", delay: 0 },
    ];

    let timer: NodeJS.Timeout;
    let currentIdx = 0;

    const runNext = () => {
      if (currentIdx >= timeline.length - 1) return;
      const step = timeline[currentIdx];
      timer = setTimeout(() => {
        currentIdx++;
        setState(timeline[currentIdx].state as EntranceState);
        runNext();
      }, step.delay);
    };

    runNext();

    return () => clearTimeout(timer);
  }, []);

  return (
    <EntranceContext.Provider value={{ state, setState, closeCircuit }}>
      {children}
    </EntranceContext.Provider>
  );
}

export function useEntrance() {
  const context = useContext(EntranceContext);
  if (!context) {
    throw new Error("useEntrance must be used within an EntranceProvider");
  }
  return context;
}
