import React, { Suspense } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import RegistrationWizard from "./RegistrationWizard";

export const metadata = {
  title: "Registrations Gateway | EXOUSIA 2026",
  description: "Secure your slot at the EXOUSIA state-level EEE technical festival. Select between festival-only passes or dynamic team-event gateways.",
};

export default function RegisterPage() {
  return (
    <div className="flex flex-col min-h-screen relative bg-transparent text-text-primary">
      <Navbar />

      <main className="flex-grow pt-24 sm:pt-32 pb-16">
        <Suspense 
          fallback={
            <div className="max-w-7xl mx-auto px-4 text-center py-20">
              <span className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin inline-block"></span>
              <span className="block font-tech text-xs text-text-secondary tracking-widest uppercase mt-4">
                AUTHENTICATING APPARATUS GATEWAY...
              </span>
            </div>
          }
        >
          <RegistrationWizard />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}
