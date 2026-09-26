"use client";
/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect, @typescript-eslint/no-unused-vars */

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { MOCK_EVENTS } from "@/data/events";
import { Event } from "@/types";
import { 
  participantSchema, 
  teamMemberSchema, 
  RegistrationFormValues,
  TeamMemberFormValues
} from "@/lib/validations/registration";
import { submitRegistrationAction } from "./actions";

export default function RegistrationWizard() {
  const searchParams = useSearchParams();
  const eventParam = searchParams.get("event") || "";

  const [step, setStep] = useState(1);
  const [formValues, setFormValues] = useState<RegistrationFormValues>({
    registrationType: eventParam ? "event-only" : "festival-only",
    eventSlug: eventParam || "",
    primaryParticipant: {
      name: "",
      email: "",
      phone: "",
      college: "",
      department: "",
      year: "1",
    },
    teamName: "",
    teamMembers: [],
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState(0);
  const [confirmationCode, setConfirmationCode] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  useEffect(() => {
    if (isSubmitting) {
      setLoadingPhase(0);
      const interval = setInterval(() => {
        setLoadingPhase(p => (p < 3 ? p + 1 : p));
      }, 550);
      return () => clearInterval(interval);
    }
  }, [isSubmitting]);

  const selectedEvent = MOCK_EVENTS.find(e => e.slug === formValues.eventSlug);

  // Initialize team members size if selected event changes
  useEffect(() => {
    if (selectedEvent && selectedEvent.team_max > 1) {
      const requiredMembersCount = selectedEvent.team_max - 1;
      const initialMembers: TeamMemberFormValues[] = Array.from({ length: requiredMembersCount }, () => ({
        name: "",
        email: "",
        phone: "",
      }));
      setFormValues(prev => ({
        ...prev,
        teamMembers: initialMembers,
      }));
    } else {
      setFormValues(prev => ({
        ...prev,
        teamName: "",
        teamMembers: [],
      }));
    }
  }, [formValues.eventSlug, selectedEvent]);

  // Validation checks per step
  const validateStep = (): boolean => {
    const errors: Record<string, string> = {};

    if (step === 1) {
      if (formValues.registrationType !== "festival-only" && !formValues.eventSlug) {
        errors.eventSlug = "Please select an event to proceed";
      }
    } else if (step === 2) {
      const result = participantSchema.safeParse(formValues.primaryParticipant);
      if (!result.success) {
        result.error.issues.forEach(issue => {
          const path = issue.path.join(".");
          errors[`primary.${path}`] = issue.message;
        });
      }
    } else if (step === 3) {
      if (selectedEvent && selectedEvent.team_max > 1) {
        if (!formValues.teamName || formValues.teamName.trim().length < 3) {
          errors.teamName = "Team name must be at least 3 characters";
        }

        // Validate each member details
        // Captain counts as member 1. So minimum additional members required is team_min - 1.
        const minMembersNeeded = selectedEvent.team_min - 1;

        formValues.teamMembers.forEach((member, idx) => {
          // If the index is less than minMembersNeeded, validation is mandatory.
          // Otherwise, it's only validated if one of the fields is filled.
          const isMandatory = idx < minMembersNeeded;
          const isFilled = member.name.trim() !== "" || member.email.trim() !== "" || member.phone.trim() !== "";

          if (isMandatory || isFilled) {
            const memberResult = teamMemberSchema.safeParse(member);
            if (!memberResult.success) {
              memberResult.error.issues.forEach(issue => {
                errors[`member.${idx}.${issue.path.join(".")}`] = issue.message;
              });
            }
          }
        });
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      // Skip step 3 (team settings) if the selected event is individual or festival pass
      if (step === 2 && (!selectedEvent || selectedEvent.team_max === 1)) {
        setStep(4);
      } else {
        setStep(prev => prev + 1);
      }
    }
  };

  const handleBack = () => {
    setValidationErrors({});
    if (step === 4 && (!selectedEvent || selectedEvent.team_max === 1)) {
      setStep(2);
    } else {
      setStep(prev => prev - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptedTerms) {
      setValidationErrors({ terms: "You must accept the terms and conditions to register" });
      return;
    }

    setIsSubmitting(true);
    setValidationErrors({});

    try {
      const response = await submitRegistrationAction(formValues);
      
      if (response.success && response.confirmationCode) {
        setConfirmationCode(response.confirmationCode);
        setStep(5);
      } else {
        setValidationErrors({ submit: response.error || "Submission failed." });
      }
    } catch (err) {
      setValidationErrors({ submit: "A network glitch occurred. Re-calibration recommended." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 1: return "COILS ROUTING CONFIGURATION";
      case 2: return "PRIMARY PARTICIPANT INFORMATION";
      case 3: return "COILS TEAM CONFIGURATION";
      case 4: return "TECHNICAL TELEMETRY PREVIEW";
      case 5: return "TRANSMISSION LOCKED SUCCESS";
      default: return "";
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative min-h-[600px] flex items-center justify-center">
      {/* Registration Supernatural Chamber Background & Live Thread Motion Layer */}
      <div className="registration-chamber-env rounded-2xl" aria-hidden="true">
        <div className="chamber-wallpaper-bg"></div>
        <div className="chamber-vignette-overlay"></div>
        <div className="chamber-threads-container">
          <!-- Live Threads Left -->
          <svg className="chamber-threads-svg chamber-threads-left" viewBox="0 0 350 1000" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="threadGradLeft1_wiz" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgba(18, 5, 8, 0.98)" />
                <stop offset="50%" stopColor="rgba(42, 10, 14, 0.85)" />
                <stop offset="100%" stopColor="rgba(10, 2, 4, 0.95)" />
              </linearGradient>
              <linearGradient id="threadGradLeftHighlight_wiz" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgba(180, 25, 30, 0.45)" />
                <stop offset="70%" stopColor="rgba(60, 10, 15, 0.2)" />
                <stop offset="100%" stopColor="rgba(15, 3, 5, 0.9)" />
              </linearGradient>
            </defs>
            <g className="thread-group-left-1">
              <path d="M -20,0 C 80,150 180,280 120,500 C 70,680 160,850 -20,1000" fill="none" stroke="url(#threadGradLeft1_wiz)" strokeWidth="4.5" strokeLinecap="round"/>
              <path d="M -10,80 C 120,220 160,380 90,620 C 40,780 130,920 -10,1020" fill="none" stroke="rgba(14, 4, 6, 0.92)" strokeWidth="3" strokeLinecap="round"/>
              <path d="M 0,200 Q 140,290 80,450 T 170,720" fill="none" stroke="url(#threadGradLeftHighlight_wiz)" strokeWidth="1.8"/>
            </g>
            <g className="thread-group-left-2">
              <path d="M -30,120 Q 210,180 40,320 T -20,520" fill="none" stroke="rgba(18, 5, 8, 0.88)" strokeWidth="2.8"/>
              <path d="M 50,300 C 190,400 240,550 60,700 C 10,780 150,890 -20,960" fill="none" stroke="url(#threadGradLeft1_wiz)" strokeWidth="3.2"/>
              <path d="M -10,400 Q 180,480 30,650 T 110,880" fill="none" stroke="rgba(160, 20, 25, 0.35)" strokeWidth="1.4"/>
            </g>
            <g className="thread-group-left-3">
              <path d="M -10,50 C 90,180 130,310 30,480" fill="none" stroke="rgba(10, 2, 4, 0.95)" strokeWidth="2"/>
              <path d="M 20,250 Q 160,350 -10,490" fill="none" stroke="rgba(140, 18, 22, 0.3)" strokeWidth="1.2"/>
              <path d="M -20,600 C 140,710 170,820 -10,950" fill="none" stroke="rgba(22, 6, 9, 0.9)" strokeWidth="2.6"/>
            </g>
          </svg>
          {/* Live Threads Right */}
          <svg className="chamber-threads-svg chamber-threads-right" viewBox="0 0 350 1000" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="threadGradRight1_wiz" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgba(18, 5, 8, 0.98)" />
                <stop offset="50%" stopColor="rgba(42, 10, 14, 0.85)" />
                <stop offset="100%" stopColor="rgba(10, 2, 4, 0.95)" />
              </linearGradient>
              <linearGradient id="threadGradRightHighlight_wiz" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgba(180, 25, 30, 0.45)" />
                <stop offset="70%" stopColor="rgba(60, 10, 15, 0.2)" />
                <stop offset="100%" stopColor="rgba(15, 3, 5, 0.9)" />
              </linearGradient>
            </defs>
            <g className="thread-group-right-1">
              <path d="M 370,0 C 270,160 170,290 230,510 C 280,690 190,860 370,1000" fill="none" stroke="url(#threadGradRight1_wiz)" strokeWidth="4.5" strokeLinecap="round"/>
              <path d="M 360,90 C 230,230 190,390 260,630 C 310,790 220,930 360,1020" fill="none" stroke="rgba(14, 4, 6, 0.92)" strokeWidth="3" strokeLinecap="round"/>
              <path d="M 350,190 Q 210,280 270,440 T 180,710" fill="none" stroke="url(#threadGradRightHighlight_wiz)" strokeWidth="1.8"/>
            </g>
            <g className="thread-group-right-2">
              <path d="M 380,110 Q 140,170 310,310 T 370,510" fill="none" stroke="rgba(18, 5, 8, 0.88)" strokeWidth="2.8"/>
              <path d="M 300,290 C 160,390 110,540 290,690 C 340,770 200,880 370,950" fill="none" stroke="url(#threadGradRight1_wiz)" strokeWidth="3.2"/>
              <path d="M 360,390 Q 170,470 320,640 T 240,870" fill="none" stroke="rgba(160, 20, 25, 0.35)" strokeWidth="1.4"/>
            </g>
            <g className="thread-group-right-3">
              <path d="M 360,60 C 260,190 220,320 320,490" fill="none" stroke="rgba(10, 2, 4, 0.95)" strokeWidth="2"/>
              <path d="M 330,240 Q 190,340 360,480" fill="none" stroke="rgba(140, 18, 22, 0.3)" strokeWidth="1.2"/>
              <path d="M 370,590 C 210,700 180,810 360,940" fill="none" stroke="rgba(22, 6, 9, 0.9)" strokeWidth="2.6"/>
            </g>
          </svg>
        </div>
      </div>
      
      {/* Wizard Box */}
      <div className="panel-modal-glass tech-border bg-bg-secondary/60 p-6 sm:p-8 shadow-accent-glow relative overflow-hidden z-10 w-full">
        
        {/* Mainframe submission validation overlay */}
        {isSubmitting && (
          <div className="absolute inset-0 bg-[#06070a]/95 z-50 flex flex-col justify-center p-6 sm:p-12 space-y-6 border border-accent">
            {/* Laser scanner sweeping line */}
            <div className="absolute left-0 right-0 h-[2px] bg-accent/60 shadow-[0_0_10px_#ff2020] animate-scanline pointer-events-none" />
            
            <div className="space-y-2">
              <span className="font-tech text-[10px] text-accent animate-pulse block">[ TRANSMISSION TERMINAL ACTIVE ]</span>
              <h3 className="font-display text-lg sm:text-xl text-text-primary uppercase tracking-widest leading-none">
                TRANSMITTING REGISTRATION TELEMETRY
              </h3>
            </div>
            
            <div className="space-y-3 font-mono text-[9px] sm:text-[10px] text-text-secondary border border-border/40 p-4 bg-black/45">
              <div className="flex justify-between items-center border-b border-border/20 pb-2">
                <span>01 // INITIALIZING SUPABASE HANDSHAKE...</span>
                <span className="text-accent font-bold">[ OK ]</span>
              </div>
              <div className="flex justify-between items-center border-b border-border/20 pb-2">
                <span>02 // RESOLVING RLS SECURITY HANDLES...</span>
                <span className={loadingPhase >= 1 ? "text-accent font-bold" : "text-text-tertiary"}>
                  {loadingPhase >= 1 ? "[ OK ]" : "[ TRANSMITTING ]"}
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-border/20 pb-2">
                <span>03 // EXECUTING ATOMIC REGISTRATION RPC...</span>
                <span className={loadingPhase >= 2 ? "text-accent font-bold" : "text-text-tertiary"}>
                  {loadingPhase >= 2 ? "[ OK ]" : "[ PENDING ]"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>04 // QUEUING SYSTEM LOGS OUTBOX EMAIL...</span>
                <span className={loadingPhase >= 3 ? "text-accent font-bold" : "text-text-tertiary"}>
                  {loadingPhase >= 3 ? "[ OK ]" : "[ WAITING ]"}
                </span>
              </div>
            </div>
            
            <div className="space-y-1 pt-2">
              <div className="text-[8px] text-text-tertiary font-tech">APPARATUS_FLUX_DENSITY</div>
              <div className="w-full h-1 bg-bg-tertiary border border-border/40 overflow-hidden relative">
                <div className="h-full bg-accent animate-pulse" style={{ width: "65%" }} />
              </div>
            </div>
          </div>
        )}
        
        {/* Header */}
        <div className="border-b border-border pb-4 mb-6">
          <div className="flex justify-between items-center mb-3 text-[8px] font-tech text-text-tertiary tracking-widest uppercase">
            <span>CONNECTION: SECURE</span>
            <span>PROTOCOL: EXOUSIA-REG-01</span>
            <span className="text-accent animate-pulse font-bold">STATUS: ACCEPTING PARTICIPANTS</span>
          </div>
          <div className="flex justify-between items-center">
            <div>
              <span className="font-tech text-xs tracking-widest text-accent uppercase block mb-1">
                [ EXOUSIA SECURE REGISTRATION TERMINAL ]
              </span>
              <div className="font-mono text-[8px] text-text-secondary">
                TELEMETRY_STEP: 0{step} {"//"} SCHEMA: {getStepTitle()} {"//"} FAULTS: {Object.keys(validationErrors).length}
              </div>
            </div>
            {step < 5 && (
              <div className="font-tech text-xs text-text-secondary">
                {step}/4
              </div>
            )}
          </div>
        </div>

        {/* Progress Grid */}
        {step < 5 && (
          <div className="grid grid-cols-4 gap-1.5 mb-8 font-mono text-[7px] text-center text-text-secondary">
            <div className={`p-1 border ${step >= 1 ? "border-accent text-accent bg-accent/5 font-bold" : "border-border"}`}>01 // EVENT</div>
            <div className={`p-1 border ${step >= 2 ? "border-accent text-accent bg-accent/5 font-bold" : "border-border"}`}>02 // IDENTITY</div>
            <div className={`p-1 border ${step >= 3 ? "border-accent text-accent bg-accent/5 font-bold" : "border-border"}`}>03 // TEAM</div>
            <div className={`p-1 border ${step >= 4 ? "border-accent text-accent bg-accent/5 font-bold" : "border-border"}`}>04 // CONFIRM</div>
          </div>
        )}

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* STEP 1: Registration Pass Selection */}
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div className="space-y-2">
                <label className="font-tech text-xs text-text-primary block tracking-wider">{"// SELECT REGISTRATION MODE"}</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                  {/* Option 1: Festival Pass */}
                  <label className={`p-4 border rounded cursor-pointer flex flex-col justify-between h-[120px] transition-all duration-300 ${
                    formValues.registrationType === "festival-only" 
                      ? "border-accent bg-accent/5" 
                      : "border-border hover:border-accent/40"
                  }`}>
                    <input 
                      type="radio" 
                      name="regType" 
                      value="festival-only"
                      checked={formValues.registrationType === "festival-only"}
                      onChange={() => setFormValues(prev => ({ ...prev, registrationType: "festival-only", eventSlug: "" }))}
                      className="sr-only"
                    />
                    <span className="font-display text-xs font-bold text-text-primary uppercase block">FESTIVAL PASS</span>
                    <span className="text-[10px] text-text-secondary leading-tight mt-2 block">
                      General entry to all exhibitions, foyer setups, and spotlights. Excludes engineering competitions.
                    </span>
                    <span className="font-mono text-[9px] text-accent mt-auto block font-bold">FREE REGISTRATION</span>
                  </label>

                  {/* Option 2: Event Entry */}
                  <label className={`p-4 border rounded cursor-pointer flex flex-col justify-between h-[120px] transition-all duration-300 ${
                    formValues.registrationType === "event-only" 
                      ? "border-accent bg-accent/5" 
                      : "border-border hover:border-accent/40"
                  }`}>
                    <input 
                      type="radio" 
                      name="regType" 
                      value="event-only"
                      checked={formValues.registrationType === "event-only"}
                      onChange={() => setFormValues(prev => ({ ...prev, registrationType: "event-only" }))}
                      className="sr-only"
                    />
                    <span className="font-display text-xs font-bold text-text-primary uppercase block">EVENT ENTRY</span>
                    <span className="text-[10px] text-text-secondary leading-tight mt-2 block">
                      Direct slot in one premium EEE engineering lab competition. Includes campus foyer entry.
                    </span>
                    <span className="font-mono text-[9px] text-accent mt-auto block font-bold">FREE REGISTRATION</span>
                  </label>

                  {/* Option 3: Combined pass */}
                  <label className={`p-4 border rounded cursor-pointer flex flex-col justify-between h-[120px] transition-all duration-300 ${
                    formValues.registrationType === "combined" 
                      ? "border-accent bg-accent/5" 
                      : "border-border hover:border-accent/40"
                  }`}>
                    <input 
                      type="radio" 
                      name="regType" 
                      value="combined"
                      checked={formValues.registrationType === "combined"}
                      onChange={() => setFormValues(prev => ({ ...prev, registrationType: "combined" }))}
                      className="sr-only"
                    />
                    <span className="font-display text-xs font-bold text-text-primary uppercase block">COMBINED PASS</span>
                    <span className="text-[10px] text-text-secondary leading-tight mt-2 block">
                      Full entrance pass covering general foyer spotlights plus reservation in one technical competition.
                    </span>
                    <span className="font-mono text-[9px] text-accent mt-auto block font-bold">FREE REGISTRATION</span>
                  </label>

                </div>
              </div>

              {/* Event selection drop-down */}
              {formValues.registrationType !== "festival-only" && (
                <div className="space-y-2 animate-fade-in">
                  <label htmlFor="eventSlug" className="font-tech text-xs text-text-primary block tracking-wider">
                    {"// SELECT LAB COMPETITION"}
                  </label>
                  <select
                    id="eventSlug"
                    value={formValues.eventSlug}
                    onChange={(e) => setFormValues(prev => ({ ...prev, eventSlug: e.target.value }))}
                    className="w-full px-3 py-2 border border-border bg-bg-secondary text-xs rounded text-text-primary focus:outline-none focus:border-accent"
                  >
                    <option value="">-- CHOOSE EVENT SCHEMA --</option>
                    {MOCK_EVENTS.filter(e => e.registration_mode === "online").map((e) => (
                      <option key={e.id} value={e.slug}>
                        {e.title} ({e.category.toUpperCase()} {"//"} {e.teamSize})
                      </option>
                    ))}
                  </select>
                  {validationErrors.eventSlug && (
                    <span className="text-[10px] font-mono text-red-500 block">{validationErrors.eventSlug}</span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Primary Pilot Information */}
          {step === 2 && (
            <div className="space-y-4 animate-fade-in font-mono text-[11px] text-text-secondary">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name */}
                <div className="space-y-1">
                  <label htmlFor="pilotName" className="font-tech text-xs text-text-primary block">FULL NAME</label>
                  <input
                    id="pilotName"
                    type="text"
                    value={formValues.primaryParticipant.name}
                    onChange={(e) => setFormValues(prev => ({
                      ...prev,
                      primaryParticipant: { ...prev.primaryParticipant, name: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-border bg-bg-secondary rounded focus:outline-none focus:border-accent text-text-primary"
                    placeholder="ENTER FULL NAME"
                  />
                  {validationErrors["primary.name"] && (
                    <span className="text-[9px] text-red-500 block">{validationErrors["primary.name"]}</span>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <label htmlFor="pilotEmail" className="font-tech text-xs text-text-primary block">EMAIL ADDRESS</label>
                  <input
                    id="pilotEmail"
                    type="email"
                    value={formValues.primaryParticipant.email}
                    onChange={(e) => setFormValues(prev => ({
                      ...prev,
                      primaryParticipant: { ...prev.primaryParticipant, email: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-border bg-bg-secondary rounded focus:outline-none focus:border-accent text-text-primary"
                    placeholder="NAME@INSTITUTION.EDU"
                  />
                  {validationErrors["primary.email"] && (
                    <span className="text-[9px] text-red-500 block">{validationErrors["primary.email"]}</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Phone */}
                <div className="space-y-1">
                  <label htmlFor="pilotPhone" className="font-tech text-xs text-text-primary block">PHONE NUMBER (10-DIGIT)</label>
                  <input
                    id="pilotPhone"
                    type="text"
                    value={formValues.primaryParticipant.phone}
                    onChange={(e) => setFormValues(prev => ({
                      ...prev,
                      primaryParticipant: { ...prev.primaryParticipant, phone: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-border bg-bg-secondary rounded focus:outline-none focus:border-accent text-text-primary"
                    placeholder="EX: 9876543210"
                  />
                  {validationErrors["primary.phone"] && (
                    <span className="text-[9px] text-red-500 block">{validationErrors["primary.phone"]}</span>
                  )}
                </div>

                {/* College */}
                <div className="space-y-1">
                  <label htmlFor="pilotCollege" className="font-tech text-xs text-text-primary block">ACADEMY / COLLEGE NAME</label>
                  <input
                    id="pilotCollege"
                    type="text"
                    value={formValues.primaryParticipant.college}
                    onChange={(e) => setFormValues(prev => ({
                      ...prev,
                      primaryParticipant: { ...prev.primaryParticipant, college: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-border bg-bg-secondary rounded focus:outline-none focus:border-accent text-text-primary"
                    placeholder="ACADEMY DETAILS"
                  />
                  {validationErrors["primary.college"] && (
                    <span className="text-[9px] text-red-500 block">{validationErrors["primary.college"]}</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Department */}
                <div className="space-y-1">
                  <label htmlFor="pilotDept" className="font-tech text-xs text-text-primary block">BRANCH / DEPARTMENT</label>
                  <input
                    id="pilotDept"
                    type="text"
                    value={formValues.primaryParticipant.department}
                    onChange={(e) => setFormValues(prev => ({
                      ...prev,
                      primaryParticipant: { ...prev.primaryParticipant, department: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-border bg-bg-secondary rounded focus:outline-none focus:border-accent text-text-primary"
                    placeholder="EX: EEE"
                  />
                  {validationErrors["primary.department"] && (
                    <span className="text-[9px] text-red-500 block">{validationErrors["primary.department"]}</span>
                  )}
                </div>

                {/* Year */}
                <div className="space-y-1">
                  <label htmlFor="pilotYear" className="font-tech text-xs text-text-primary block">YEAR OF STUDY</label>
                  <select
                    id="pilotYear"
                    value={formValues.primaryParticipant.year}
                    onChange={(e) => setFormValues(prev => ({
                      ...prev,
                      primaryParticipant: { ...prev.primaryParticipant, year: e.target.value as any }
                    }))}
                    className="w-full px-3 py-2 border border-border bg-bg-secondary rounded focus:outline-none focus:border-accent text-text-primary"
                  >
                    <option value="1">1st Year // Freshman</option>
                    <option value="2">2nd Year // Sophomore</option>
                    <option value="3">3rd Year // Junior</option>
                    <option value="4">4th Year // Senior</option>
                  </select>
                  {validationErrors["primary.year"] && (
                    <span className="text-[9px] text-red-500 block">{validationErrors["primary.year"]}</span>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* STEP 3: Coils Team Settings */}
          {step === 3 && selectedEvent && (
            <div className="space-y-6 animate-fade-in font-mono text-[11px] text-text-secondary">
              <div className="p-3 border border-border bg-bg-primary/60 rounded">
                <span className="text-accent block font-tech text-[10px] font-bold uppercase mb-1">{"// EVENT CONSTRAINTS"}</span>
                <span>EVENT: {selectedEvent.title} {"//"} REQUIRED SIZE: {selectedEvent.teamSize}</span>
              </div>

              {/* Team Name */}
              <div className="space-y-1">
                <label htmlFor="teamName" className="font-tech text-xs text-text-primary block">TEAM NAME</label>
                <input
                  id="teamName"
                  type="text"
                  value={formValues.teamName}
                  onChange={(e) => setFormValues(prev => ({ ...prev, teamName: e.target.value }))}
                  className="w-full px-3 py-2 border border-border bg-bg-secondary rounded focus:outline-none focus:border-accent text-text-primary"
                  placeholder="TEAM ALIAS"
                />
                {validationErrors.teamName && (
                  <span className="text-[9px] text-red-500 block">{validationErrors.teamName}</span>
                )}
              </div>

              {/* Team Members Fields */}
              <div className="space-y-4 pt-2">
                <span className="font-tech text-xs text-text-primary block tracking-wider uppercase">
                  {"// COIL MEMBER SPECS"}
                </span>

                {formValues.teamMembers.map((member, idx) => {
                  const isMandatory = idx < (selectedEvent.team_min - 1);
                  return (
                    <div key={idx} className="p-4 border border-border/80 bg-bg-secondary/20 rounded space-y-3">
                      <div className="flex justify-between items-center border-b border-border/30 pb-1">
                        <span className="font-tech text-[9px] text-accent font-bold uppercase">
                          MEMBER 0{idx + 2} {isMandatory ? "(MANDATORY)" : "(OPTIONAL)"}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {/* Member Name */}
                        <div className="space-y-0.5">
                          <input
                            type="text"
                            placeholder="NAME"
                            value={member.name}
                            onChange={(e) => {
                              const updated = [...formValues.teamMembers];
                              updated[idx].name = e.target.value;
                              setFormValues(prev => ({ ...prev, teamMembers: updated }));
                            }}
                            className="w-full px-2 py-1.5 border border-border bg-bg-secondary rounded text-[10px] text-text-primary focus:outline-none focus:border-accent"
                          />
                          {validationErrors[`member.${idx}.name`] && (
                            <span className="text-[8px] text-red-500 block">{validationErrors[`member.${idx}.name`]}</span>
                          )}
                        </div>

                        {/* Member Email */}
                        <div className="space-y-0.5">
                          <input
                            type="email"
                            placeholder="EMAIL"
                            value={member.email}
                            onChange={(e) => {
                              const updated = [...formValues.teamMembers];
                              updated[idx].email = e.target.value;
                              setFormValues(prev => ({ ...prev, teamMembers: updated }));
                            }}
                            className="w-full px-2 py-1.5 border border-border bg-bg-secondary rounded text-[10px] text-text-primary focus:outline-none focus:border-accent"
                          />
                          {validationErrors[`member.${idx}.email`] && (
                            <span className="text-[8px] text-red-500 block">{validationErrors[`member.${idx}.email`]}</span>
                          )}
                        </div>

                        {/* Member Phone */}
                        <div className="space-y-0.5">
                          <input
                            type="text"
                            placeholder="PHONE"
                            value={member.phone}
                            onChange={(e) => {
                              const updated = [...formValues.teamMembers];
                              updated[idx].phone = e.target.value;
                              setFormValues(prev => ({ ...prev, teamMembers: updated }));
                            }}
                            className="w-full px-2 py-1.5 border border-border bg-bg-secondary rounded text-[10px] text-text-primary focus:outline-none focus:border-accent"
                          />
                          {validationErrors[`member.${idx}.phone`] && (
                            <span className="text-[8px] text-red-500 block">{validationErrors[`member.${idx}.phone`]}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          )}

          {/* STEP 4: Technical Preview */}
          {step === 4 && (
            <div className="space-y-6 animate-fade-in font-mono text-[11px] text-text-secondary">
              
              {/* Telemetry log blocks */}
              <div className="border border-border rounded bg-bg-secondary/20 p-4 space-y-3">
                <span className="text-accent font-tech text-[10px] font-bold block uppercase">{"// CLIENT SCHEMATIC PREVIEW"}</span>
                
                <div className="grid grid-cols-2 gap-2 border-b border-border/40 pb-2">
                  <span>REGISTRATION TYPE:</span>
                  <span className="text-text-primary uppercase">{formValues.registrationType.replace("-", " ")}</span>
                </div>

                {selectedEvent && (
                  <div className="grid grid-cols-2 gap-2 border-b border-border/40 pb-2">
                    <span>SELECTED LAB:</span>
                    <span className="text-accent font-bold uppercase">{selectedEvent.title}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 border-b border-border/40 pb-2">
                  <span>PRIMARY REGISTRANT:</span>
                  <span className="text-text-primary uppercase">{formValues.primaryParticipant.name} ({formValues.primaryParticipant.email})</span>
                </div>

                <div className="grid grid-cols-2 gap-2 border-b border-border/40 pb-2">
                  <span>ACADEMY / COLLEGE:</span>
                  <span className="text-text-primary uppercase">{formValues.primaryParticipant.college}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 border-b border-border/40 pb-2">
                  <span>YEAR &amp; BRANCH:</span>
                  <span className="text-text-primary uppercase">Year {formValues.primaryParticipant.year} {"//"} {formValues.primaryParticipant.department}</span>
                </div>

                {selectedEvent && selectedEvent.team_max > 1 && (
                  <div className="space-y-1">
                    <span className="text-text-tertiary block font-tech">[ COIL CREW DETAILS ]</span>
                    <div className="grid grid-cols-2 gap-2">
                      <span>TEAM NAME:</span>
                      <span className="text-text-primary uppercase font-bold">{formValues.teamName}</span>
                    </div>
                    {formValues.teamMembers.filter(m => m.name.trim() !== "").map((m, idx) => (
                      <div key={idx} className="grid grid-cols-2 gap-2 text-text-tertiary">
                        <span>MEMBER 0{idx + 2}:</span>
                        <span>{m.name.toUpperCase()} ({m.phone})</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Policy Check */}
              <div className="space-y-3 pt-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="mt-0.5 text-accent focus:ring-0 focus:ring-offset-0 border-border rounded bg-bg-secondary w-3.5 h-3.5"
                  />
                  <span className="text-[10px] text-text-secondary leading-snug">
                    I verify that all entered telemetry is correct, and I agree to EXOUSIA&apos;s Department Rules and academic honor codes.
                  </span>
                </label>
                {validationErrors.terms && (
                  <span className="text-[9px] text-red-500 block">{validationErrors.terms}</span>
                )}
              </div>

            </div>
          )}

          {/* STEP 5: Success Transmission Confirmation */}
          {step === 5 && (
            <div className="space-y-6 animate-fade-in text-center py-6 font-mono">
              <div className="inline-flex items-center justify-center w-12 h-12 border border-accent bg-accent/5 text-accent mb-4 shadow-accent-glow">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <div className="space-y-2">
                <span className="font-tech text-xs tracking-widest text-accent uppercase block">
                  [ COILS ALIGNED // LOCKED ]
                </span>
                <h2 className="font-display font-extrabold text-2xl tracking-wider text-text-primary uppercase">
                  TRANSMISSION SUCCESSFUL
                </h2>
              </div>

              <div className="p-4 border border-accent bg-bg-primary/50 max-w-sm mx-auto">
                <span className="text-text-tertiary text-[8px] block tracking-widest uppercase mb-1">
                  UNIQUE CONFIRMATION RECEIPT
                </span>
                <span className="font-tech text-lg text-accent text-shadow-accent tracking-widest block font-bold">
                  {confirmationCode}
                </span>
              </div>

              <p className="text-[10px] text-text-secondary leading-relaxed max-w-md mx-auto font-mono">
                Your registration entry is recorded in the EXOUSIA active microgrid database. A confirmation logs email has been queued in the outbox to <span className="text-text-primary font-bold">{formValues.primaryParticipant.email}</span>.
              </p>

              <div className="pt-4">
                <Link
                  href="/events"
                  className="px-6 py-2.5 bg-accent/15 border border-accent text-accent font-tech font-bold text-xs tracking-widest hover:bg-accent/25 transition-all duration-300 shadow-accent-glow cursor-pointer inline-block"
                >
                  [ DISCOVER OTHER LABS ]
                </Link>
              </div>
            </div>
          )}

          {step < 5 && validationErrors.submit && (
            <div className="p-4 border border-red-500/40 bg-red-500/5 text-xs font-mono text-red-500 uppercase tracking-wider animate-pulse mb-6">
              [ ANOMALY // TRANSACTION_REJECTED ]: {validationErrors.submit}
            </div>
          )}

          {/* Controls Panel */}
          {step < 5 && (
            <div className="border-t border-border/40 pt-6 flex justify-between">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-bg-tertiary border border-border hover:border-accent hover:text-accent font-tech text-xs tracking-wider transition-all duration-300 cursor-pointer disabled:opacity-50"
                >
                  [ BACK_SCHEMATIC ]
                </button>
              ) : (
                <div />
              )}
              
              {step < 4 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-5 py-2 bg-accent/15 border border-accent text-accent font-tech font-bold text-xs tracking-wider transition-all duration-300 hover:bg-accent/25 hover:shadow-accent-glow cursor-pointer"
                >
                  [ NEXT_SEQUENCE ]
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-accent/15 border border-accent text-accent font-tech font-bold text-xs tracking-wider transition-all duration-300 hover:bg-accent/25 hover:shadow-accent-glow cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-3 h-3 rounded-full border border-accent border-t-transparent animate-spin inline-block"></span>
                      TRANSMITTING...
                    </>
                  ) : (
                    "[ TRANSMIT REGISTRATION ]"
                  )}
                </button>
              )}
            </div>
          )}

        </form>

      </div>
    </div>
  );
}
