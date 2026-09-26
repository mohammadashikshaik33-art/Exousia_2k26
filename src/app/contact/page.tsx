import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { FESTIVAL_INFO } from "@/data/events";
import { getPublicCoordinators } from "@/lib/data";

export default async function ContactPage() {
  const coordinators = await getPublicCoordinators();

  // Filter convenors vs student lead structures
  const convenors = FESTIVAL_INFO.contactLeads.filter(c => c.role.includes("Convenor"));
  
  return (
    <div className="flex flex-col min-h-screen relative bg-transparent text-text-primary">
      <Navbar />

      <main className="flex-grow pt-24 sm:pt-32 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full z-20">
        
        {/* Page Header */}
        <div className="border-b border-border pb-6 mb-12">
          <span className="font-tech text-xs tracking-[0.3em] text-accent uppercase block mb-2">
            [ COMMUNICATIONS // HELPDESK ]
          </span>
          <h1 className="font-display font-extrabold text-4xl sm:text-5xl tracking-wider text-text-primary uppercase">
            CONTACT LEADS &amp; OPERATIONS
          </h1>
          <p className="font-tech text-[10px] text-text-secondary uppercase mt-1">
            NODE: GENERAL_INQUIRY // RECALIBRATION_COILS: ACTIVE
          </p>
        </div>

        {/* 2-Column: Convenors and Student Coordinators */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start mb-12">
          
          {/* Left Column: Academic Convenors */}
          <div className="lg:col-span-4 space-y-6">
            <h2 className="font-display font-bold text-xl text-text-primary tracking-wide uppercase border-b border-border/40 pb-2">
              FACULTY CONVENORS
            </h2>
            <p className="text-xs text-text-secondary leading-relaxed font-mono">
              For official administrative inquiries, institutional representations, and permissions checks, contact the Department Office leads directly.
            </p>

            <div className="space-y-4">
              {convenors.map((lead) => (
                <div key={lead.name} className="tech-border bg-bg-secondary p-4 shadow-sm font-mono">
                  <span className="font-tech text-[8px] text-accent tracking-widest block mb-1 uppercase">
                    {lead.role}
                  </span>
                  <h3 className="font-display text-sm font-bold text-text-primary uppercase mb-2">
                    {lead.name}
                  </h3>
                  {lead.email && (
                    <a 
                      href={`mailto:${lead.email}`}
                      className="font-mono text-[9px] text-accent hover:underline block uppercase"
                    >
                      {lead.email}
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Student Coordinators */}
          <div className="lg:col-span-8 space-y-6">
            <h2 className="font-display font-bold text-xl text-text-primary tracking-wide uppercase border-b border-border/40 pb-2">
              STUDENT MANAGEMENT TEAM
            </h2>
            <p className="text-xs text-text-secondary leading-relaxed font-mono">
              For event specifications, registration conflicts, team size allowances, and venue coordination, contact our student operations heads.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {coordinators.map((c) => (
                <div key={c.id} className="p-4 border border-border bg-bg-secondary/40 flex flex-col justify-between h-[130px]">
                  <div>
                    <span className="font-tech text-[8px] text-accent tracking-widest block uppercase mb-1">
                      {c.role}
                    </span>
                    <h3 className="font-display text-sm font-bold text-text-primary uppercase">
                      {c.name}
                    </h3>
                    <span className="text-[9px] font-mono text-text-tertiary block">
                      {c.department}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-t border-border/40 pt-2 mt-4 font-mono text-[9px]">
                    {c.email && (
                      <a href={`mailto:${c.email}`} className="text-text-secondary hover:text-accent">
                        EMAIL
                      </a>
                    )}
                    {c.phone && (
                      <a href={`tel:${c.phone}`} className="text-accent hover:underline font-bold text-shadow-accent">
                        {c.phone}
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Helpdesk Notice */}
        <div className="p-4 border border-border bg-bg-secondary/20 max-w-2xl">
          <span className="font-tech text-[10px] text-accent font-bold tracking-widest block mb-1 uppercase">
            [ REGISTRATION HELPDESK ]
          </span>
          <p className="text-[11px] text-text-secondary leading-relaxed font-mono">
            Online registration issues? Please report your unique confirmation code along with your registered email and team name to Nitin Kumar (Technical Lead) at <a href={`mailto:${FESTIVAL_INFO.contactLeads[2].email}`} className="text-accent underline">{FESTIVAL_INFO.contactLeads[2].email}</a> for manual database updates.
          </p>
        </div>

      </main>

      <Footer />
    </div>
  );
}
