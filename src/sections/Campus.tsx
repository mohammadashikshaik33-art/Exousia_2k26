import React from "react";

export default function Campus() {
  const venues = [
    { name: "EEE Auditorium", code: "AUD-01", use: "Inaugural Ceremony & Poster Events" },
    { name: "Main Electrical Machinery Lab", code: "LAB-01", use: "Circuit Debugging / Hardware Challenges" },
    { name: "Embedded Systems Lab", code: "LAB-02", use: "Firmware Hackathon & IoT Prototypes" },
    { name: "Foyer Exhibition Hall", code: "EXH-01", use: "Spot Events & Oscilloscope Art" },
    { name: "Seminar Room B", code: "SEM-02", use: "Stranger Flux Escape Room" },
  ];

  return (
    <section 
      id="campus" 
      className="min-h-[80vh] py-section-gap px-margin-mobile md:px-margin-desktop relative section-observe"
    >
      <div className="relative z-10 max-w-7xl mx-auto">
        <h2 className="font-display text-headline-lg-mobile md:text-headline-lg text-primary tracking-wider mb-12 bloom-glow">
          SECTOR MAP
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
          {/* Left Side: Sector Directories */}
          <div className="lg:col-span-5 space-y-6">
            <h3 className="font-mono text-label-mono text-on-surface-variant tracking-widest mb-4 uppercase border-b border-outline-variant/30 pb-2">
              SECTOR ARCHIVE DIRECTORY
            </h3>
            
            <div className="space-y-4">
              {venues.map((venue) => (
                <div 
                  key={venue.code} 
                  className="p-4 border border-outline-variant/30 bg-surface-container hover:border-primary/50 transition-colors duration-300"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-display text-xs font-bold text-on-surface tracking-wider">
                      FACILITY // {venue.code}
                    </span>
                    <span className="font-mono text-[9px] text-primary px-2 py-0.5 border border-primary/20 bg-primary/5 uppercase font-medium">
                      {venue.name}
                    </span>
                  </div>
                  <span className="text-[11px] text-on-surface-variant block font-sans">
                    {venue.use}
                  </span>
                </div>
              ))}
            </div>

            {/* Transit specifications */}
            <div className="font-mono text-[10px] text-on-surface-variant space-y-2 pt-2 border-t border-outline-variant/20">
              <div>{"// TRANSIT LOGS:"}</div>
              <div>• By Rail: Central Campus Junction Station is 3.5 km from the EEE block.</div>
              <div>• By Air: International Airport is 42 km from the campus, connected by highway metro.</div>
            </div>
          </div>

          {/* Right Side: Visual Map Frame */}
          <div className="lg:col-span-7">
            <div className="aspect-video bg-surface-container border border-outline-variant/30 flex items-center justify-center relative overflow-hidden group">
              {/* Graphic background backdrop pattern */}
              <div 
                className="absolute inset-0 bg-repeat opacity-30 pointer-events-none" 
                style={{
                  backgroundImage: "url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PHBhdGggZD0iTTAgMGg0MHY0MEgwVjB6bTIwIDIwYTEgMSAwIDEgMCAwLTJ2MmEyIDIgMCAxIDEgMCA0djJhNCA0IDAgMSAwIDAtOHYyYTIgMiAwIDEgMSAwIDR2MmExIDEgMCAxIDAgMC0yeiIgZmlsbD0iI2ZmYjRhOCIgZmlsbC1vcGFjaXR5PSIwLjA1IiBmaWxsLXJ1bGU9ImV2ZW5vZGQiLz48L3N2Zz4=')"
                }}
              />
              
              <div className="text-center relative z-10 px-4">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-4 group-hover:text-primary transition-colors duration-300">
                  satellite_alt
                </span>
                <p className="font-mono text-label-mono text-on-surface-variant tracking-widest uppercase">
                  Initializing Topographic Data...
                </p>
                <p className="font-mono text-[10px] text-primary mt-2">
                  [MAP RENDER PENDING SITE CLEARANCE]
                </p>
              </div>

              {/* Coordinates status label */}
              <div className="absolute bottom-4 left-4 font-mono text-[9px] text-on-surface-variant/60">
                ZOOM: 1.0X // TARGET: EEE BLOCK CENTRAL
              </div>
              <div className="absolute bottom-4 right-4 font-mono text-[9px] text-primary/80">
                LAT: 13.0827 / LON: 80.2707
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
