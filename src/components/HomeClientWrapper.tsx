"use client";

import React, { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/sections/Hero";
import EventStatusStrip from "@/components/EventStatusStrip";
import Countdown from "@/components/Countdown";
import About from "@/sections/About";
import Events from "@/sections/Events";
import Schedule from "@/sections/Schedule";
import PosterShowcase from "@/sections/PosterShowcase";
import Teaser from "@/sections/Teaser";
import Campus from "@/sections/Campus";
import RegistrationCTA from "@/sections/RegistrationCTA";
import Contact from "@/sections/Contact";
import Footer from "@/components/Footer";
import { useEntrance } from "@/context/EntranceContext";

import { Event, FestivalEdition } from "@/types";

interface HomeClientWrapperProps {
  festival: FestivalEdition | null;
  events: Event[];
}

export default function HomeClientWrapper({ festival, events }: HomeClientWrapperProps) {
  const { state } = useEntrance();
  const isUnlocked = state === "unlocked";
  const [navScrolled, setNavScrolled] = useState(false);

  // Scroll spy listener matching the Stitch scroll state checks
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100) {
        setNavScrolled(true);
      } else {
        setNavScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div 
      id="main-content"
      className={`min-h-screen relative bg-transparent text-on-surface select-text ${
        isUnlocked ? "main-visible pointer-events-auto" : "pointer-events-none h-screen overflow-hidden opacity-0"
      }`}
    >
      <Navbar navScrolled={navScrolled} />

      <main className="flex-grow flex flex-col">
        <Hero />
        <EventStatusStrip festival={festival} />
        <Countdown targetDate={festival?.registration_closes_at} />
        <Events events={events} />
        <Schedule />
        <About />
        <PosterShowcase />
        <Teaser />
        <Campus />
        <RegistrationCTA />
        <Contact />
      </main>

      <Footer />
    </div>
  );
}
