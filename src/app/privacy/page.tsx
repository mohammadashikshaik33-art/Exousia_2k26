import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function PrivacyPage() {
  return (
    <div className="flex flex-col min-h-screen relative bg-transparent text-text-primary">
      <Navbar />

      <main className="flex-grow pt-24 sm:pt-32 pb-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full z-20 font-mono">
        
        <div className="border-b border-border pb-6 mb-8 font-mono">
          <span className="font-tech text-xs tracking-[0.3em] text-accent uppercase block mb-2">
            [ COMPLIANCE // DATA SECURITY ]
          </span>
          <h1 className="font-display font-extrabold text-3xl tracking-wider text-text-primary uppercase">
            PRIVACY STATEMENT &amp; PROTOCOLS
          </h1>
          <p className="font-tech text-[9px] text-text-secondary uppercase mt-1">
            STATUS: ACTIVE_COMPLIANCE // RETENTION: 180_DAYS
          </p>
        </div>

        <div className="space-y-6 text-xs sm:text-sm text-text-secondary leading-relaxed">
          <section className="space-y-2">
            <h2 className="font-display text-sm font-bold text-text-primary uppercase font-mono tracking-wide text-accent">
              1. Information Collection and Scopes
            </h2>
            <p>
              We collect minimal participant details required to coordinate the EXOUSIA state-level EEE technical festival. 
              This information includes name, email, phone number, year of study, department branch, and college name.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-display text-sm font-bold text-text-primary uppercase font-mono tracking-wide text-accent">
              2. Data Use and Processing
            </h2>
            <p>
              Your contact details are processed to:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Record event reservations and verify capacity thresholds.</li>
              <li>Deliver unique confirmation codes and scheduled outbox notification emails.</li>
              <li>Identify duplicate entries to prevent oversubscription.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="font-display text-sm font-bold text-text-primary uppercase font-mono tracking-wide text-accent">
              3. Security and RLS Protection
            </h2>
            <p>
              Data is stored securely on Supabase hosting databases. Row-level Security (RLS) is enabled on all transactional 
              tables. No participant detail is exposed on public routing bundles or readable outside the authenticated admin dashboard roles.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-display text-sm font-bold text-text-primary uppercase font-mono tracking-wide text-accent">
              4. Data Retention Limits
            </h2>
            <p>
              In accordance with department rules, all participant personal information is scrubbed and purged from the database after a period of 180 days from the close of the festival.
            </p>
          </section>
        </div>

      </main>

      <Footer />
    </div>
  );
}
