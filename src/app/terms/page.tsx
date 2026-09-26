import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function TermsPage() {
  return (
    <div className="flex flex-col min-h-screen relative bg-transparent text-text-primary">
      <Navbar />

      <main className="flex-grow pt-24 sm:pt-32 pb-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full z-20 font-mono">
        
        <div className="border-b border-border pb-6 mb-8 font-mono">
          <span className="font-tech text-xs tracking-[0.3em] text-accent uppercase block mb-2">
            [ COMPLIANCE // FESTIVAL CODE ]
          </span>
          <h1 className="font-display font-extrabold text-3xl tracking-wider text-text-primary uppercase">
            TERMS &amp; REGULATIONS CODE
          </h1>
          <p className="font-tech text-[9px] text-text-secondary uppercase mt-1">
            STATUS: ACTIVE_REGULATION // ENTRY: FREE_ALLOWANCE
          </p>
        </div>

        <div className="space-y-6 text-xs sm:text-sm text-text-secondary leading-relaxed">
          <section className="space-y-2">
            <h2 className="font-display text-sm font-bold text-text-primary uppercase font-mono tracking-wide text-accent">
              1. Registration and Free Access
            </h2>
            <p>
              EXOUSIA is a free technical festival hosted by the EEE Department. No fee, checkout charge, or payment gateway 
              is enabled for entries. Any third-party claiming payment for registrations should be reported immediately.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-display text-sm font-bold text-text-primary uppercase font-mono tracking-wide text-accent">
              2. Technical Capacity Limits
            </h2>
            <p>
              Admissions to premium events (Circuit Scramble, Phase Inversion Hackathon, etc.) are capped by physical laboratory 
              capacities. Secure slots are allocated on a first-come, first-served basis. Online registration does not guarantee entry if 
              reporting deadlines at the venue are missed.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-display text-sm font-bold text-text-primary uppercase font-mono tracking-wide text-accent">
              3. Academic Conduct &amp; Safety
            </h2>
            <p>
              Participants are expected to behave in accordance with the host campus&apos;s code of conduct. Damaging laboratory assets, DC/AC dynamos, 
              stators, controllers, or logic trainers will result in immediate disqualification and academic reference flags.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-display text-sm font-bold text-text-primary uppercase font-mono tracking-wide text-accent">
              4. Event Timeline Deviations
            </h2>
            <p>
              The organizing team reserves the right to modify schedule slots, venues, and team rules due to operational limits 
              or power grid variations. Notifications will be displayed at the department foyer.
            </p>
          </section>
        </div>

      </main>

      <Footer />
    </div>
  );
}
