"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

interface NavbarProps {
  navScrolled?: boolean;
}

const navLinks = [
  { label: "HOME", hash: "home" },
  { label: "EVENTS", hash: "events" },
  { label: "ABOUT", hash: "about" },
  { label: "CAMPUS", hash: "campus" },
  { label: "CONTACT", hash: "contact" },
];

export default function Navbar({ navScrolled = false }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const pathname = usePathname();
  const router = useRouter();

  // Intersection Observer for scroll spy
  useEffect(() => {
    if (pathname !== "/") return;

    const sections = navLinks.map(link => document.getElementById(link.hash)).filter(Boolean) as HTMLElement[];
    // Include register section as well to spy on it
    const registerSec = document.getElementById("register");
    if (registerSec) sections.push(registerSec);

    const observerOptions = {
      root: null,
      rootMargin: "-20% 0px -60% 0px", // Custom margins to feel natural during scrolling
      threshold: 0.1,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute("id");
          if (id) {
            // Map register section back to register or keep active state
            setActiveSection(id === "register" ? "register" : id);
          }
        }
      });
    }, observerOptions);

    sections.forEach((section) => observer.observe(section));

    return () => {
      sections.forEach((section) => observer.unobserve(section));
    };
  }, [pathname]);

  const handleNavClick = (hash: string) => {
    setIsOpen(false);
    
    if (pathname === "/") {
      const element = document.getElementById(hash);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      router.push(`/#${hash}`);
    }
  };

  return (
    <nav 
      id="main-nav"
      className={`top-nav fixed top-0 w-full z-50 flex justify-between items-center px-margin-mobile md:px-margin-desktop py-6 bg-gradient-to-b from-surface-container-lowest to-transparent transition-all duration-500 ${
        navScrolled 
          ? "nav-scrolled bg-surface-container-lowest/90 backdrop-blur-md border-b border-outline-variant/20 py-4" 
          : ""
      }`}
    >
      {/* Brand logo details matching Stitch */}
      <div 
        className="flex items-center gap-4 cursor-pointer select-none"
        onClick={() => handleNavClick("home")}
      >
        <span aria-hidden="true" className="material-symbols-outlined text-primary text-2xl">waves</span>
        <span className="font-display text-headline-lg-mobile md:text-headline-lg text-primary tracking-tighter uppercase">
          EXOUSIA
        </span>
      </div>

      {/* Main Navigation Links */}
      <div className="hidden md:flex items-center space-x-8 font-mono text-label-mono nav-links">
        {navLinks.map((link) => {
          const isActive = activeSection === link.hash;
          return (
            <button
              key={link.hash}
              onClick={() => handleNavClick(link.hash)}
              data-cursor="magnet"
              className={`hover-bloom transition-all duration-300 uppercase tracking-widest text-[11px] cursor-pointer ${
                isActive 
                  ? "nav-active text-primary font-bold" 
                  : "text-on-surface opacity-70"
              }`}
            >
              {link.label}
            </button>
          );
        })}
      </div>

      {/* Primary CTA button */}
      <div className="hidden md:block">
        <button 
          className="border border-primary text-primary px-6 py-2 font-mono text-label-mono uppercase hover:bg-primary/20 hover:shadow-[0_0_15px_rgba(255,180,168,0.4)] transition-all duration-300 cursor-pointer"
          onClick={() => handleNavClick("register")}
        >
          REGISTER
        </button>
      </div>

      {/* Mobile menu trigger */}
      <div className="md:hidden">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="text-primary hover:text-primary-container p-2 focus:outline-none flex items-center justify-center"
        >
          <span className="material-symbols-outlined">{isOpen ? "close" : "menu"}</span>
        </button>
      </div>

      {/* Mobile navigation tray */}
      {isOpen && (
        <div className="absolute top-full left-0 w-full bg-surface-container border-b border-outline-variant/30 py-4 flex flex-col items-center space-y-4 md:hidden font-mono text-label-mono">
          {navLinks.map((link) => (
            <button
              key={link.hash}
              onClick={() => handleNavClick(link.hash)}
              className="text-on-surface/80 hover:text-primary transition-all duration-300 uppercase tracking-widest text-xs py-1.5"
            >
              {link.label}
            </button>
          ))}
          <button 
            className="border border-primary text-primary px-8 py-2 text-xs uppercase hover:bg-primary/10 transition-all duration-300"
            onClick={() => handleNavClick("register")}
          >
            REGISTER
          </button>
        </div>
      )}
    </nav>
  );
}
