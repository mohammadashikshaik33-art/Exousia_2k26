import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { FESTIVAL_INFO } from "@/data/events";
import { getVenues, getPublishedFestival } from "@/lib/data";

export default async function CampusPage() {
  const venues = await getVenues();
  const festival = await getPublishedFestival();

  const coords = festival?.primary_venue_id 
    ? (venues.find(v => v.id === festival.primary_venue_id)?.coordinates || FESTIVAL_INFO.location.coordinates)
    : FESTIVAL_INFO.location.coordinates;

  return (
    <div className="flex flex-col min-h-screen relative bg-transparent text-text-primary">
      <Navbar />

      <main className="flex-grow pt-24 sm:pt-32 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full z-20">
        
        {/* Page Header */}
        <div className="border-b border-border pb-6 mb-12">
          <span className="font-tech text-xs tracking-[0.3em] text-accent uppercase block mb-2">
            [ LOCATIONAL ATLAS // WAYFINDING ]
          </span>
          <h1 className="font-display font-extrabold text-4xl sm:text-5xl tracking-wider text-text-primary uppercase">
            CAMPUS ATLAS &amp; VENUES
          </h1>
          <p className="font-tech text-[10px] text-text-secondary uppercase mt-1">
            SECTOR: VVIT_EEE_BLOCK // COORDINATES: {coords}
          </p>
        </div>

        {/* 2-Column Map and Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start mb-16">
          
          {/* Left Column: Interactive Map & Wayfinding */}
          <div className="lg:col-span-5 space-y-6">
            <div className="tech-border bg-bg-secondary p-5 shadow-accent-glow relative overflow-hidden aspect-[4/3] flex flex-col justify-between">
              
              <div className="flex justify-between items-center border-b border-border/80 pb-2 mb-4 font-tech text-[9px] text-text-secondary">
                <span>SCHEMATIC [MAP-01]: BLOCK_GRID</span>
                <span className="text-accent animate-pulse-slow">GPS: LOCKED_NOMINAL</span>
              </div>

              {/* Vector Map */}
              <div className="flex-1 border border-border/60 bg-black/60 relative overflow-hidden flex items-center justify-center p-4">
                <div className="absolute inset-0 eee-grid pointer-events-none opacity-40"></div>
                
                <svg className="w-full h-full text-accent/20" viewBox="0 0 200 150" fill="none">
                  {/* Drawing Main Buildings */}
                  <rect x="15" y="20" width="55" height="30" rx="0" stroke="currentColor" strokeWidth="1" />
                  <text x="42.5" y="38" fill="currentColor" fontSize="7" textAnchor="middle" fontFamily="monospace">AUDITORIUM</text>
                  
                  <line x1="70" y1="35" x2="110" y2="35" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" />
                  
                  <rect x="110" y="15" width="75" height="50" rx="0" stroke="currentColor" strokeWidth="1" />
                  <text x="147.5" y="43" fill="currentColor" fontSize="7" textAnchor="middle" fontFamily="monospace">EEE BLOCK (G-F3)</text>
                  
                  <line x1="147.5" y1="65" x2="147.5" y2="105" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" />
                  
                  <rect x="110" y="105" width="75" height="30" rx="0" stroke="currentColor" strokeWidth="1" />
                  <text x="147.5" y="123" fill="currentColor" fontSize="7" textAnchor="middle" fontFamily="monospace">POWER LABS (G)</text>

                  {/* Highlights Node */}
                  <circle cx="147.5" cy="40" r="4.5" fill="currentColor" className="text-accent animate-ping" />
                  <circle cx="147.5" cy="40" r="2.5" fill="var(--accent)" />
                </svg>

                <div className="absolute bottom-2 left-2 text-[8px] font-mono text-accent">
                  TARGET: EEE DEPARTMENT ATRIUM
                </div>
              </div>

              <div className="mt-4 font-mono text-[8px] text-text-tertiary flex justify-between">
                <span>SECTOR RANGE: 150M</span>
                <span>LAT: {coords}</span>
              </div>
            </div>

            {/* External Navigation Link */}
            <a 
              href={`https://maps.google.com/?q=${coords}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 bg-accent/15 border border-accent text-accent hover:bg-accent/25 hover:shadow-accent-glow transition-all duration-300 font-tech font-bold text-xs tracking-widest text-center block"
            >
              [ LAUNCH EXTERNAL NAVIGATION MAP ]
            </a>
          </div>

          {/* Right Column: Venues Lists */}
          <div className="lg:col-span-7 space-y-6">
            <h2 className="font-display font-bold text-xl sm:text-2xl text-text-primary tracking-wide uppercase">
              SECTOR VENUE INDEX
            </h2>
            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed font-mono">
              All events, debugging arenas, and visual laboratories are stationed inside the Electrical & Electronics 
              Engineering Block. Please refer to the room assignments below to report for your sessions.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {venues.map((venue) => (
                <div key={venue.id} className="p-4 border border-border bg-bg-secondary/40">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-display text-xs font-bold text-text-primary leading-tight">
                        {venue.name}
                      </h3>
                      <span className="text-[8px] font-mono text-text-tertiary uppercase">
                        {venue.building}
                      </span>
                    </div>
                    {venue.room_number && (
                      <span className="font-tech text-[9px] text-accent px-1.5 py-0.5 border border-accent/20 bg-accent/5">
                        {venue.room_number}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-text-secondary leading-relaxed">
                    {venue.description || "No description loaded."}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Wayfinding Transit Logs */}
        <div className="border-t border-border/40 pt-12">
          <h2 className="font-display font-bold text-2xl tracking-wide text-text-primary uppercase mb-8">
            TRANSIT LOGISTICS
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono">
            <div className="p-5 border border-border bg-bg-secondary/20">
              <span className="font-tech text-xs text-accent tracking-widest block mb-2 uppercase">
                [ BY VEHICLE ]
              </span>
              <p className="text-xs text-text-secondary leading-relaxed">
                The VVIT Campus is located along the Guntur-Vijayawada highway in Nambur. Adequate car and bike transit gates are provided.
              </p>
            </div>
            <div className="p-5 border border-border bg-bg-secondary/20">
              <span className="font-tech text-xs text-accent tracking-widest block mb-2 uppercase">
                [ BY RAILWAYS ]
              </span>
              <p className="text-xs text-text-secondary leading-relaxed">
                Nambur Railway Station is the closest minor halt (2 km). Guntur Central Station (10 km) and Vijayawada Junction (24 km) connect to major networks.
              </p>
            </div>
            <div className="p-5 border border-border bg-bg-secondary/20">
              <span className="font-tech text-xs text-accent tracking-widest block mb-2 uppercase">
                [ BY FLIGHTS ]
              </span>
              <p className="text-xs text-text-secondary leading-relaxed">
                Vijayawada International Airport (Gannavaram) is located 45 km from the campus, connected directly by transit highways.
              </p>
            </div>
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}
