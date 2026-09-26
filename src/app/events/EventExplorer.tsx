/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { Event } from "@/types";

export default function EventExplorer({ events }: { events: Event[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Load initial filters from URL Search Params
  const initialCategory = searchParams.get("category") || "all";
  const initialDay = searchParams.get("day") || "all";
  const initialSearch = searchParams.get("search") || "";

  const [activeCategory, setActiveCategory] = useState<string>(initialCategory);
  const [activeDay, setActiveDay] = useState<string>(initialDay);
  const [searchQuery, setSearchQuery] = useState<string>(initialSearch);
  const [selectedEventId, setSelectedEventId] = useState<string>("");

  const dossierRef = useRef<HTMLDivElement>(null);
  const sweepBtn1Ref = useRef<HTMLDivElement>(null);
  const sweepBtn2Ref = useRef<HTMLDivElement>(null);
  const btn1Ref = useRef<HTMLAnchorElement>(null);
  const btn2Ref = useRef<HTMLAnchorElement>(null);

  // Sync state if URL changes (e.g. back navigation)
  useEffect(() => {
    setActiveCategory(searchParams.get("category") || "all");
    setActiveDay(searchParams.get("day") || "all");
    setSearchQuery(searchParams.get("search") || "");
  }, [searchParams]);

  // Handle URL parameters update
  const updateFilters = (newCat: string, newDay: string, newSearch: string) => {
    const params = new URLSearchParams();
    if (newCat !== "all") params.set("category", newCat);
    if (newDay !== "all") params.set("day", newDay);
    if (newSearch.trim() !== "") params.set("search", newSearch);

    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat);
    updateFilters(cat, activeDay, searchQuery);
  };

  const handleDayChange = (day: string) => {
    setActiveDay(day);
    updateFilters(activeCategory, day, searchQuery);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    updateFilters(activeCategory, activeDay, val);
  };

  // Category counts metrics
  const getCategoryCount = (cat: string) => {
    if (cat === "all") return events.length;
    return events.filter((e) => e.category === cat).length;
  };

  // Filter calculations
  const filteredEvents = events.filter((event) => {
    const matchesSearch = searchQuery.trim() === "" 
      ? true 
      : event.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        event.short_description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.discipline_tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = activeCategory === "all" ? true : event.category === activeCategory;
    const matchesDay = activeDay === "all" ? true : String(event.day) === activeDay;

    return matchesSearch && matchesCategory && matchesDay;
  });

  // Default active selection
  useEffect(() => {
    if (filteredEvents.length > 0) {
      if (!filteredEvents.some((e) => e.id === selectedEventId)) {
        setSelectedEventId(filteredEvents[0].id);
      }
    } else {
      setSelectedEventId("");
    }
  }, [filteredEvents, selectedEventId]);

  const activeEvent = filteredEvents.find((e) => e.id === selectedEventId) || filteredEvents[0];

  // GSAP animation when selected event changes
  useGSAP(() => {
    if (activeEvent) {
      // CRT glitch scan effect on dossier load
      gsap.fromTo(".dossier-scanner", 
        { top: "0%", opacity: 0 },
        { top: "100%", opacity: 1, duration: 0.5, ease: "power1.inOut" }
      );
      gsap.from(".dossier-body-block", {
        opacity: 0,
        y: 10,
        duration: 0.35,
        stagger: 0.05,
      });
      // Animate capacity progress bars
      gsap.fromTo(".capacity-bar-fill",
        { width: "0%" },
        { width: "80%", duration: 0.8, ease: "power2.out" }
      );
    }
  }, [selectedEventId]);

  const handleMouseEnter = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (ref.current) {
      gsap.fromTo(ref.current, { x: "-100%" }, { x: "300%", duration: 0.7, ease: "power2.inOut" });
    }
  };

  const handleMouseDown = (ref: React.RefObject<HTMLAnchorElement | null>) => {
    if (ref.current) {
      gsap.to(ref.current, { y: 2, scale: 0.98, duration: 0.08 });
    }
  };

  const handleMouseUp = (ref: React.RefObject<HTMLAnchorElement | null>) => {
    if (ref.current) {
      gsap.to(ref.current, { y: 0, scale: 1.0, duration: 0.18, ease: "back.out(1.5)" });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full font-mono">
      
      {/* Page Title & Counters banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-border/40 pb-6">
        <div className="space-y-2">
          <span className="font-tech text-xs tracking-widest text-accent uppercase">[ SPECTRAL ARCHIVE INDEX ]</span>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl tracking-wider text-text-primary uppercase">
            EVENT CABINET
          </h2>
          <p className="font-mono text-[9px] text-text-secondary uppercase">
            CORES COMMITTED: {filteredEvents.length} OF {events.length} ACTIVE CHANNELS
          </p>
        </div>

        {/* Text Search Input */}
        <div className="w-full md:max-w-xs relative z-20">
          <input
            type="text"
            placeholder="SEARCH CIRCUITS, FILE CODES..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full px-4 py-2.5 text-xs font-tech tracking-wider border border-border bg-bg-secondary focus:outline-none focus:border-accent text-text-primary placeholder:text-text-tertiary rounded-none"
          />
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(""); updateFilters(activeCategory, activeDay, ""); }}
              className="absolute right-3 top-3 text-text-tertiary hover:text-accent font-mono text-[9px] uppercase cursor-pointer"
            >
              [ CLEAR ]
            </button>
          )}
        </div>
      </div>

      {/* Split Explorer Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-10">
        
        {/* Left Side: Filter Options & Index List */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Category Tabs */}
          <div className="p-4 border border-border bg-bg-secondary/20">
            <span className="font-tech text-[10px] text-text-tertiary tracking-widest block mb-3 uppercase">
              {"// CATEGORY_FILTERS"}
            </span>
            <div className="flex flex-col gap-1.5 font-tech text-xs">
              {(["all", "technical", "spot", "fun"] as const).map((cat) => {
                const labelMap = { all: "ALL CHANNELS", technical: "TECHNICAL INCIDENTS", spot: "SPOT EXPERIMENTS", fun: "RECREATIONAL FLUX" };
                const active = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => handleCategoryChange(cat)}
                    data-cursor="magnet"
                    data-cursor-label="FILTER"
                    className={`w-full px-3 py-2 border text-left uppercase tracking-wider flex justify-between items-center transition-all duration-200 cursor-pointer ${
                      active
                        ? "bg-accent/10 text-accent border-accent font-bold shadow-accent-glow"
                        : "bg-bg-secondary/40 border-border text-text-secondary hover:border-accent hover:text-accent"
                    }`}
                  >
                    <span>{labelMap[cat]}</span>
                    <span className="font-mono text-[8px] px-1.5 py-0.5 bg-bg-tertiary border border-border/60">
                      {getCategoryCount(cat)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Chronology Day filter */}
          <div className="p-4 border border-border bg-bg-secondary/20">
            <span className="font-tech text-[10px] text-text-tertiary tracking-widest block mb-3 uppercase">
              {"// TEMPORAL_CHRONOLOGY"}
            </span>
            <div className="grid grid-cols-3 gap-2 font-tech text-xs">
              {(["all", "1", "2"] as const).map((dayVal) => {
                const active = activeDay === dayVal;
                return (
                  <button
                    key={dayVal}
                    onClick={() => handleDayChange(dayVal)}
                    data-cursor="magnet"
                    data-cursor-label="CYCLE"
                    className={`py-1.5 border text-center uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                      active
                        ? "bg-accent/15 text-accent border-accent font-bold shadow-accent-glow"
                        : "bg-bg-secondary/40 border-border text-text-secondary hover:border-accent hover:text-accent"
                    }`}
                  >
                    {dayVal === "all" ? "ALL" : `DAY ${dayVal}`}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Vertical Index Lists */}
          <div className="border border-border bg-bg-secondary/20 p-4">
            <span className="font-tech text-[10px] text-text-tertiary tracking-widest block mb-3 uppercase">
              {"// CABINET_FILES_INDEX"}
            </span>
            <div className="max-h-[300px] overflow-y-auto space-y-1 pr-1 scrollbar-thin scrollbar-thumb-accent">
              {filteredEvents.map((e) => {
                const active = e.id === selectedEventId;
                return (
                  <button
                    key={e.id}
                    onClick={() => setSelectedEventId(e.id)}
                    data-cursor="magnet"
                    data-cursor-label="LOAD"
                    className={`w-full p-2.5 border text-left text-xs uppercase tracking-wide flex justify-between items-center transition-all duration-200 cursor-pointer ${
                      active 
                        ? "border-accent bg-accent/5 text-accent font-bold"
                        : "border-border/40 hover:border-accent/40 text-text-secondary"
                    }`}
                  >
                    <span className="truncate max-w-[190px]">{e.title}</span>
                    <span className="text-[7px] font-mono text-text-tertiary block font-normal">EX-0{e.day}</span>
                  </button>
                );
              })}
              {filteredEvents.length === 0 && (
                <div className="text-[9px] text-text-tertiary text-center py-6">INDEX CORES DE-ALIGNED</div>
              )}
            </div>
          </div>

        </div>

        {/* Right Side: Large Dynamic Dossier Sheet */}
        <div className="lg:col-span-8">
          {activeEvent ? (
            <div 
              ref={dossierRef}
              className="relative tech-border bg-bg-secondary/40 p-6 sm:p-8 shadow-accent-glow min-h-[500px] flex flex-col justify-between overflow-hidden"
            >
              {/* Dynamic sweep scan scanner */}
              <div className="absolute left-0 right-0 h-0.5 bg-accent/40 shadow-[0_0_10px_#ff2020] opacity-0 pointer-events-none dossier-scanner z-30" />

              {/* Distressed confidential stamps */}
              <div className="absolute right-6 top-16 opacity-20 classified-stamp rotate-[-10deg] select-none pointer-events-none z-0">
                TOP SECRET // EXOUSIA
              </div>

              <div className="relative z-10 space-y-6">
                
                {/* Dossier ID Header */}
                <div className="flex justify-between items-center border-b border-border pb-3 dossier-body-block font-mono text-[9px] text-text-secondary">
                  <span>SPECIFICATION SHEETS // REF-ID: EX-ID-{activeEvent.id.substring(0, 6).toUpperCase()}</span>
                  <span className="font-tech text-accent animate-pulse">GATE: INVERSION_STABLE</span>
                </div>

                {/* Event Category & Day Tag */}
                <div className="dossier-body-block">
                  <span className="px-2.5 py-0.5 border border-accent/20 bg-accent/5 text-[9px] font-tech text-accent uppercase tracking-widest">
                    {activeEvent.category} {"// DAY 0"}{activeEvent.day}
                  </span>
                  <h3 className="font-display font-extrabold text-2xl sm:text-3xl tracking-wider text-text-primary uppercase pt-2 select-none">
                    {activeEvent.title}
                  </h3>
                </div>

                {/* Visual Capacity Meter Instrument */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border border-border/40 p-4 bg-black/45 dossier-body-block font-mono text-[10px]">
                  <div>
                    <span className="text-text-tertiary block font-tech text-[8px] uppercase">01 // TARGET VENUE</span>
                    <span className="text-text-primary uppercase font-bold">{activeEvent.venue}</span>
                  </div>
                  <div>
                    <span className="text-text-tertiary block font-tech text-[8px] uppercase">02 // REPORT TIME</span>
                    <span className="text-text-primary font-bold">{activeEvent.time}</span>
                  </div>
                  <div>
                    <span className="text-text-tertiary block font-tech text-[8px] uppercase">03 // CREW CAP</span>
                    <span className="text-text-primary font-bold">{activeEvent.teamSize}</span>
                  </div>
                </div>

                {/* Descriptions */}
                <div className="space-y-2 dossier-body-block">
                  <span className="font-tech text-xs tracking-wider text-accent uppercase block">[ SYSTEM SYNOPSIS ]</span>
                  <p className="text-text-secondary text-xs sm:text-sm leading-relaxed">
                    {activeEvent.full_description}
                  </p>
                </div>

                {/* Dynamic Load Indicators */}
                <div className="space-y-3 border border-border/40 p-4 bg-black/25 dossier-body-block font-mono text-[10px]">
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="font-tech text-text-tertiary">CORE_RESONANCE_THREAT</span>
                      <span className="text-accent font-bold">
                        {activeEvent.category === "technical" ? "75% // CRITICAL" : "30% // MINIMAL"}
                      </span>
                    </div>
                    {/* Simulated loading bar */}
                    <div className="w-full h-1.5 bg-bg-tertiary border border-border/40">
                      <div 
                        className="h-full bg-accent capacity-bar-fill" 
                        style={{ width: activeEvent.category === "technical" ? "75%" : "30%" }} 
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="font-tech text-text-tertiary">CAPACITY_RESERVATION_LOAD</span>
                      <span className="text-text-primary font-bold">80% // GATES ACTIVE</span>
                    </div>
                    {/* Simulated loading bar */}
                    <div className="w-full h-1.5 bg-bg-tertiary border border-border/40">
                      <div className="h-full bg-text-primary capacity-bar-fill" style={{ width: "80%" }} />
                    </div>
                  </div>
                </div>

              </div>

              {/* Dossier Foot console CTA Buttons */}
              <div className="border-t border-border pt-6 flex flex-wrap gap-4 justify-end relative z-20 mt-8">
                <Link
                  ref={btn2Ref}
                  href={`/events/${activeEvent.slug}`}
                  data-cursor="magnet"
                  data-cursor-label="SPECS"
                  onMouseEnter={() => handleMouseEnter(sweepBtn2Ref)}
                  onMouseDown={() => handleMouseDown(btn2Ref)}
                  onMouseUp={() => handleMouseUp(btn2Ref)}
                  className="relative px-5 py-2.5 border border-border bg-bg-secondary text-text-primary text-xs font-tech tracking-widest cursor-pointer select-none overflow-hidden active:translate-y-0.5"
                >
                  <div ref={sweepBtn2Ref} className="absolute inset-0 w-1/4 bg-gradient-to-r from-transparent via-accent/15 to-transparent -skew-x-12 -translate-x-full pointer-events-none" />
                  <span>[ OPEN FULL SPEC SHEET ]</span>
                </Link>
                <Link
                  ref={btn1Ref}
                  href={`/register?event=${activeEvent.slug}`}
                  data-cursor="magnet"
                  data-cursor-label="ACCESS"
                  onMouseEnter={() => handleMouseEnter(sweepBtn1Ref)}
                  onMouseDown={() => handleMouseDown(btn1Ref)}
                  onMouseUp={() => handleMouseUp(btn1Ref)}
                  className="relative px-5 py-2.5 border border-accent bg-accent/10 text-accent text-xs font-tech font-bold tracking-widest cursor-pointer select-none overflow-hidden active:translate-y-0.5"
                >
                  <div ref={sweepBtn1Ref} className="absolute inset-0 w-1/4 bg-gradient-to-r from-transparent via-accent/25 to-transparent -skew-x-12 -translate-x-full pointer-events-none" />
                  <span>[ TRANSMIT REGISTRATION ACCESS ]</span>
                </Link>
              </div>

            </div>
          ) : (
            <div className="tech-border bg-bg-secondary/20 p-8 text-center flex flex-col justify-center items-center min-h-[500px]">
              <span className="text-text-tertiary font-tech text-xs tracking-widest block uppercase mb-2">
                [ NO SPECIFICATIONS ACTIVATED ]
              </span>
              <p className="text-xs text-text-secondary max-w-sm font-mono">
                Select an active incident dossier index tab from the cabinet left directory rail to initialize core telemetry reading analysis.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
