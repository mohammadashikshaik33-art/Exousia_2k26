import React from "react";
import { FESTIVAL_INFO } from "@/data/events";

export default function Contact() {
  return (
    <section 
      id="contact" 
      className="py-section-gap px-margin-mobile md:px-margin-desktop relative bg-surface-container-low/50 section-observe"
    >
      <div className="relative z-10 max-w-4xl mx-auto">
        <h2 className="font-display text-headline-lg-mobile md:text-headline-lg text-primary tracking-wider mb-12 bloom-glow">
          COMMUNICATIONS LINK
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Left Column: Real Team Contacts Directory */}
          <div>
            <h3 className="font-mono text-label-mono text-on-surface-variant mb-6 border-b border-outline-variant/30 pb-2 uppercase">
              PRIMARY CHANNELS
            </h3>
            
            <div className="space-y-6">
              {FESTIVAL_INFO.contactLeads.map((lead, idx) => (
                <div 
                  key={idx}
                  className="border border-outline-variant/30 bg-surface-container p-5 hover:border-primary/50 hover:shadow-[0_0_15px_rgba(255,180,168,0.15)] transition-all duration-300"
                >
                  <div className="text-[10px] font-mono text-on-surface-variant mb-2">
                    COORDINATOR // 0{idx + 1}
                  </div>
                  <h4 className="font-display text-lg font-bold text-on-surface uppercase mb-3 tracking-wider">
                    {lead.name} ({lead.role})
                  </h4>
                  <div className="space-y-1 text-xs font-mono">
                    {lead.phone && (
                      <div className="flex items-center gap-2 text-on-surface/80 hover:text-primary transition-colors cursor-pointer">
                        <span className="material-symbols-outlined text-sm">call</span>
                        <a href={`tel:${lead.phone}`} className="hover:underline">{lead.phone}</a>
                      </div>
                    )}
                    {lead.email && (
                      <div className="flex items-center gap-2 text-on-surface/80 hover:text-primary transition-colors cursor-pointer mt-1">
                        <span className="material-symbols-outlined text-sm">mail</span>
                        <a href={`mailto:${lead.email}`} className="hover:underline">{lead.email}</a>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* General Inquiry Mail Channel */}
              <div className="border border-outline-variant/30 bg-surface-container p-5 hover:border-primary/50 hover:shadow-[0_0_15px_rgba(255,180,168,0.15)] transition-all duration-300">
                <div className="text-[10px] font-mono text-on-surface-variant mb-2">
                  OFFICIAL BROADCAST
                </div>
                <h4 className="font-display text-lg font-bold text-on-surface uppercase mb-3 tracking-wider">
                  GENERAL QUERIES
                </h4>
                <div className="flex items-center gap-2 text-xs font-mono text-on-surface/80 hover:text-primary transition-colors cursor-pointer">
                  <span className="material-symbols-outlined text-sm">mail</span>
                  <a href={`mailto:${FESTIVAL_INFO.contactLeads[0].email}`} className="hover:underline">
                    {FESTIVAL_INFO.contactLeads[0].email}
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Contact Message Form (Stitch Design) */}
          <div>
            <h3 className="font-mono text-label-mono text-on-surface-variant mb-6 border-b border-outline-variant/30 pb-2 uppercase">
              TRANSMIT MESSAGE
            </h3>
            <form className="space-y-4">
              <input 
                className="w-full bg-surface-container border border-outline-variant/50 p-3 text-on-surface font-mono text-xs focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" 
                placeholder="IDENTIFICATION STR" 
                type="text"
              />
              <textarea 
                className="w-full bg-surface-container border border-outline-variant/50 p-3 text-on-surface font-mono text-xs focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" 
                placeholder="PAYLOAD..." 
                rows={4}
              />
              <button 
                className="w-full border border-primary text-primary py-3 font-mono text-xs hover:bg-primary/10 transition-colors uppercase tracking-widest cursor-pointer" 
                type="button"
              >
                EXECUTE TRANSMISSION
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
