import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function AboutPage() {
  const laboratories = [
    {
      name: "Electrical Machinery Lab",
      purpose: "Testing and modeling high-capacity stator dynamos, AC/DC generators, transformers, and synchronous industrial motor drives.",
      assets: ["Variable frequency drives", "Tachometer controllers", "Resistive loading grids"]
    },
    {
      name: "Embedded Systems & IoT Lab",
      purpose: "Designing edge firmware, real-time sensing nodes, FPGA layouts, and low-latency wireless microgrids.",
      assets: ["ESP32 Development kits", "Logic analyzers", "RTOS development benches"]
    },
    {
      name: "Power Electronics & Drives Lab",
      purpose: "Harnessing solid-state switches, inverters, cyclo-converters, and smart grid synchronization controllers.",
      assets: ["Digital storage oscilloscopes", "Thyristor modules", "DC-DC Buck converters"]
    },
    {
      name: "Control Systems & Robotics Lab",
      purpose: "Modeling PID feedback control loops, feedback loops, servo actuation, and automated pick-and-place arms.",
      assets: ["PLC controllers", "DC servo motors", "Analog system simulators"]
    }
  ];

  const milestones = [
    { year: "2018", event: "Inception of EXOUSIA as a local technical symposium in the EEE department block." },
    { year: "2021", event: "Transitioned to a state-level technical festival, adding embedded firmware hackathons." },
    { year: "2024", event: "Recorded over 1,200 participants across 15 engineering academies in South India." },
    { year: "2026", event: "Launch of the Phase Inversion narrative, exploring anomalies, smart microgrids, and signal arts." }
  ];

  return (
    <div className="flex flex-col min-h-screen relative bg-transparent text-text-primary">
      <Navbar />

      <main className="flex-grow pt-24 sm:pt-32 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full z-20">
        
        {/* Page Header */}
        <div className="border-b border-border pb-6 mb-12">
          <span className="font-tech text-xs tracking-[0.3em] text-accent uppercase block mb-2">
            [ DEPT_ARCHIVE // TECHNICAL PORTFOLIO ]
          </span>
          <h1 className="font-display font-extrabold text-4xl sm:text-5xl tracking-wider text-text-primary uppercase">
            ABOUT THE DEPARTMENT &amp; EXOUSIA
          </h1>
          <p className="font-tech text-[10px] text-text-secondary uppercase mt-1">
            REPORT_SEC: EEE_ATRIUM // COIL_RECON: ENABLED
          </p>
        </div>

        {/* 2-Column Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start mb-16">
          <div className="lg:col-span-7 space-y-6">
            <h2 className="font-display font-bold text-xl sm:text-2xl text-accent tracking-wide uppercase">
              DEPARTMENT OF ELECTRICAL &amp; ELECTRONICS ENGINEERING
            </h2>
            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed font-mono">
              The Department of EEE at VVIT stands as a center of academic excellence and technical innovation. 
              We prepare engineers to solve real-world problems in power generation, transmission, renewable grids, 
              micro-controllers, and smart edge processors. 
            </p>
            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed font-mono">
              From classical electromagnetism to complex neural automation networks, our students study systems that 
              power modern civilization. **EXOUSIA** is the department&apos;s flagship state-level technical festival—a platform 
              designed to display EEE DNA through advanced engineering puzzles, design challenges, and visual code.
            </p>
            <div className="p-4 border border-border bg-bg-secondary/40 font-mono text-[10px] text-text-secondary">
              <span className="text-accent block font-tech mb-2 font-bold">[ DEPARTMENT FOCUS AREAS ]</span>
              <div className="grid grid-cols-2 gap-2">
                <div>• Solid State Inverters</div>
                <div>• Smart Grid Telemetry</div>
                <div>• Brushless DC Motors</div>
                <div>• Embedded Edge Firmware</div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="tech-border bg-bg-secondary p-6 shadow-accent-glow">
              <span className="font-tech text-[10px] text-accent tracking-widest block mb-4">[ LAB_TELEMETRY // NOMINAL ]</span>
              <div className="space-y-4 font-mono text-[10px]">
                <div className="flex justify-between border-b border-border/40 pb-2">
                  <span>ESTABLISHED</span>
                  <span className="text-text-primary">2007</span>
                </div>
                <div className="flex justify-between border-b border-border/40 pb-2">
                  <span>FACULTY CORPS</span>
                  <span className="text-text-primary">28 ACADEMICS</span>
                </div>
                <div className="flex justify-between border-b border-border/40 pb-2">
                  <span>RESEARCH LABS</span>
                  <span className="text-text-primary">5 INSTALLED</span>
                </div>
                <div className="flex justify-between">
                  <span>ACADEMIC ENROLLMENT</span>
                  <span className="text-text-primary">480+ UNDERGRADUATE</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Labs Showcase */}
        <div className="mb-16">
          <h2 className="font-display font-bold text-2xl tracking-wide text-text-primary uppercase mb-8 border-b border-border/40 pb-2">
            RESEARCH &amp; ACADEMIC LABORATORIES
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {laboratories.map((lab) => (
              <div 
                key={lab.name}
                className="p-6 border border-border bg-bg-secondary/30 hover:border-accent/40 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <h3 className="font-display font-bold text-base text-accent uppercase mb-2">
                    {lab.name}
                  </h3>
                  <p className="text-xs text-text-secondary leading-relaxed mb-4 font-mono">
                    {lab.purpose}
                  </p>
                </div>
                <div className="pt-2">
                  <span className="text-[9px] font-tech text-text-tertiary block mb-1">CORE EQUIPMENT:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {lab.assets.map((item) => (
                      <span key={item} className="px-2 py-0.5 border border-border/60 bg-bg-tertiary font-mono text-[9px] text-text-secondary">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Festival Timeline History */}
        <div>
          <h2 className="font-display font-bold text-2xl tracking-wide text-text-primary uppercase mb-8 border-b border-border/40 pb-2">
            THE CHRONICLE OF EXOUSIA
          </h2>
          <div className="relative border-l border-border pl-6 space-y-8 max-w-3xl">
            {milestones.map((item) => (
              <div key={item.year} className="relative group font-mono">
                {/* Timeline node */}
                <div className="absolute -left-[29px] top-1.5 w-1.5 h-1.5 bg-border group-hover:bg-accent border border-bg-primary transition-colors duration-300"></div>
                
                <span className="font-tech text-sm font-bold text-accent tracking-wider block">
                  {item.year}
                </span>
                <p className="text-xs text-text-secondary leading-relaxed mt-1">
                  {item.event}
                </p>
              </div>
            ))}
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}
