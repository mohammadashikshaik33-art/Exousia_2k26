import React from "react";
import Link from "next/link";
import { FESTIVAL_INFO } from "@/data/events";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-bg-secondary border-t border-border mt-auto transition-colors duration-500">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Brand/About */}
          <div className="space-y-4">
            <h3 className="font-display font-bold text-lg sm:text-xl tracking-widest text-accent text-shadow-accent">
              {FESTIVAL_INFO.title}
            </h3>
            <p className="text-xs text-text-secondary leading-relaxed max-w-sm">
              An experience engineered by the Department of Electrical & Electronics Engineering. 
              Exploring the anomaly where high currents cross into alternate phases.
            </p>
            <div className="flex space-x-4">
              {/* Instagram placeholder link */}
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-text-secondary hover:text-accent transition-colors"
                aria-label="Instagram"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-tech text-xs tracking-widest text-text-primary">
              QUICK CONNECTIONS
            </h4>
            <ul className="space-y-2 text-xs font-tech">
              <li>
                <Link href="#hero" className="text-text-secondary hover:text-accent transition-colors">
                  [01] HOME READOUT
                </Link>
              </li>
              <li>
                <Link href="#about" className="text-text-secondary hover:text-accent transition-colors">
                  [02] FIELD MATRIX / ABOUT
                </Link>
              </li>
              <li>
                <Link href="#events" className="text-text-secondary hover:text-accent transition-colors">
                  [03] EVENT ARCHITECTURE
                </Link>
              </li>
              <li>
                <Link href="#campus" className="text-text-secondary hover:text-accent transition-colors">
                  [04] CAMPUS GRID
                </Link>
              </li>
            </ul>
          </div>

          {/* EEE Technical Metadata */}
          <div className="space-y-4 text-xs font-mono text-text-secondary">
            <h4 className="font-tech text-xs tracking-widest text-text-primary">
              SYSTEM READINGS
            </h4>
            <div className="space-y-1 text-[10px]">
              <div>COORDINATES: {FESTIVAL_INFO.location.coordinates}</div>
              <div>FREQUENCY: 50.00 Hz (STABLE)</div>
              <div>POTENTIAL: High Voltage / Prestige</div>
              <div>VERSION: EX-2026.08.15</div>
            </div>
          </div>

        </div>

        <div className="border-t border-border mt-8 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] font-mono text-text-tertiary">
          <div>
            © {currentYear} {FESTIVAL_INFO.title}. All rights reserved. EEE Department.
          </div>
          <div>
            ENGINEERED WITH REACT & NEXT.JS
          </div>
        </div>
      </div>
    </footer>
  );
}
