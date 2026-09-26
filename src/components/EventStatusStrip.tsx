import React from "react";
import { FESTIVAL_INFO } from "@/data/events";
import { FestivalEdition } from "@/types";

interface Props {
  festival?: FestivalEdition | null;
}

export default function EventStatusStrip({ festival }: Props) {
  // Format dates from database if configured
  const getFormattedDates = () => {
    if (!festival) return FESTIVAL_INFO.dates.formatted;

    const starts = new Date(festival.starts_at);
    const ends = new Date(festival.ends_at);
    
    const startStr = starts.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const endStr = ends.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    
    return `${startStr} - ${endStr}`;
  };

  const getStatusLabel = () => {
    if (!festival) return "REGISTRATIONS OPEN";

    switch (festival.registration_status) {
      case "open":
        return "REGISTRATIONS OPEN";
      case "closed":
        return "REGISTRATIONS CLOSED";
      case "suspended":
        return "REGISTRATIONS SUSPENDED";
      case "upcoming":
        return "REGISTRATIONS UPCOMING";
      default:
        return "REGISTRATIONS OPEN";
    }
  };

  const isClosed = festival?.registration_status === "closed" || festival?.registration_status === "suspended";

  return (
    <div className="w-full border-y border-border bg-bg-secondary/60 backdrop-blur-sm relative z-30 transition-all duration-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono text-[9px] sm:text-[10px] text-text-secondary">
        
        {/* Date block */}
        <div className="flex items-center gap-2">
          <span className="text-accent font-tech font-bold uppercase">[ DATES ]</span>
          <span className="text-text-primary uppercase">{getFormattedDates()}</span>
        </div>

        {/* Location block */}
        <div className="flex items-center gap-2">
          <span className="text-accent font-tech font-bold uppercase">[ ATOM_LOC ]</span>
          <span className="text-text-primary uppercase">{FESTIVAL_INFO.location.name}</span>
          <span className="text-text-tertiary">({FESTIVAL_INFO.location.coordinates})</span>
        </div>

        {/* Status block */}
        <div className="flex items-center gap-2">
          <span className="text-accent font-tech font-bold uppercase font-bold">[ GATEWAY ]</span>
          <div className="flex items-center">
            <span className={`w-1.5 h-1.5 mr-1.5 shadow-accent-glow ${
              isClosed ? "bg-red-500" : "bg-accent animate-pulse"
            }`}></span>
            <span className={`font-bold uppercase text-shadow-accent ${
              isClosed ? "text-red-500" : "text-accent"
            }`}>{getStatusLabel()}</span>
          </div>
        </div>

      </div>
    </div>
  );
}
