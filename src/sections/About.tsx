import React from "react";

export default function About() {
  return (
    <section 
      id="about" 
      className="py-section-gap px-margin-mobile md:px-margin-desktop relative bg-surface-container-low/50 section-observe"
    >
      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <h2 className="font-display text-headline-lg-mobile md:text-headline-lg text-primary tracking-wider mb-8 bloom-glow">
          THE DIRECTIVE
        </h2>
        
        <p className="font-sans text-body-lg text-on-surface-variant mb-12 leading-relaxed">
          EXOUSIA is not a festival; it is an experiment. A convergence of the brightest analytical minds tasked with unraveling the fabric of conventional technology. We exist in the margins of innovation, where code meets chaos.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          <div className="border-l border-primary/30 pl-4">
            <span className="material-symbols-outlined text-primary mb-2">memory</span>
            <h4 className="font-mono text-label-mono text-on-surface mb-2 uppercase">PROCESSING</h4>
            <p className="font-sans text-body-md text-on-surface-variant text-sm">
              Over 50+ hours of continuous intellectual engagement and technical workshops.
            </p>
          </div>

          <div className="border-l border-primary/30 pl-4">
            <span className="material-symbols-outlined text-primary mb-2">group</span>
            <h4 className="font-mono text-label-mono text-on-surface mb-2 uppercase">SUBJECTS</h4>
            <p className="font-sans text-body-md text-on-surface-variant text-sm">
              1000+ participants from leading technological institutes across the grid.
            </p>
          </div>

          <div className="border-l border-primary/30 pl-4">
            <span className="material-symbols-outlined text-primary mb-2">emoji_events</span>
            <h4 className="font-mono text-label-mono text-on-surface mb-2 uppercase">REWARDS</h4>
            <p className="font-sans text-body-md text-on-surface-variant text-sm">
              Substantial capital injections and exclusive hardware for successful anomaly containment.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
