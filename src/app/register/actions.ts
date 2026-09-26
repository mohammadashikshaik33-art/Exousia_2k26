/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { registrationSchema, RegistrationFormValues } from "@/lib/validations/registration";
import { getSupabaseServerClient, isSupabaseServerConfigured } from "@/lib/supabase/server";

export interface RegistrationResult {
  success: boolean;
  confirmationCode?: string;
  error?: string;
}

export async function submitRegistrationAction(
  formValues: RegistrationFormValues
): Promise<RegistrationResult> {
  // 1. Authoritative Server-side validation
  const validation = registrationSchema.safeParse(formValues);
  if (!validation.success) {
    const fieldErrors = validation.error.issues.map((issue) => issue.message).join(", ");
    return {
      success: false,
      error: `Telemetry validation failed: ${fieldErrors}`,
    };
  }

  // 1.5. Validate Cloudflare Turnstile token
  if (formValues.turnstileToken) {
    const turnstileCheck = await verifyTurnstileToken(formValues.turnstileToken);
    if (!turnstileCheck.success) {
      return {
        success: false,
        error: `Bot verification check failed: ${turnstileCheck.error || "Invalid response token."}`,
      };
    }
  } else {
    // If secret key exists in production and token is missing, reject submission
    if (process.env.TURNSTILE_SECRET_KEY && process.env.NODE_ENV === "production") {
      return {
        success: false,
        error: "Bot verification payload is missing. Telemetry rejected.",
      };
    }
  }

  // 2. Generate transaction details
  const randHex = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1).toUpperCase();
  const confirmationCode = `EX-${randHex()}-${randHex()}`;

  // Deterministic idempotency hash to prevent accidental double clicks/replays
  const email = formValues.primaryParticipant.email.toLowerCase().trim();
  const phone = formValues.primaryParticipant.phone.trim();
  const eventSlug = formValues.eventSlug || "pass";
  const idempotencyKey = `idemp_${email}_${phone}_${eventSlug}`;

  // 3. Configuration validation with production blocking checks
  if (!isSupabaseServerConfigured()) {
    if (process.env.NODE_ENV === "production") {
      console.error("[Supabase Server Action] Database credentials missing in production environment!");
      return {
        success: false,
        error: "Database credentials are not configured. Registration portal is offline.",
      };
    }
    console.warn(
      "[Supabase Server Action] Credentials missing. Running registration in local mock sandbox mode."
    );
    // Return a mocked success receipt after a brief simulated delay
    await new Promise((resolve) => setTimeout(resolve, 800));
    return {
      success: true,
      confirmationCode: `EX-MOCK-${randHex()}`,
    };
  }

  // 4. Secure Database Insertion via service-role client
  try {
    const supabase = await getSupabaseServerClient(true);
    if (!supabase) {
      return {
        success: false,
        error: "Server configuration anomaly. Privileged keys missing.",
      };
    }

    // Filter out blank team members from jsonb payload
    const activeTeamMembers = formValues.teamMembers.filter(
      (m) => m.name.trim() !== "" && m.email.trim() !== "" && m.phone.trim() !== ""
    );

    // Call atomic RPC transactional function
    const { data, error } = await supabase.rpc("register_participant_atomic", {
      p_festival_slug: "exousia-2026",
      p_registration_kind: formValues.registrationType,
      p_primary_name: formValues.primaryParticipant.name.trim(),
      p_primary_email: email,
      p_primary_phone: phone,
      p_primary_college: formValues.primaryParticipant.college.trim(),
      p_primary_department: formValues.primaryParticipant.department.trim(),
      p_primary_year: formValues.primaryParticipant.year,
      p_team_name: formValues.teamName?.trim() || null,
      p_team_members: JSON.stringify(activeTeamMembers),
      p_event_slug: formValues.eventSlug || null,
      p_confirmation_code: confirmationCode,
      p_idempotency_key: idempotencyKey,
    });

    if (error) {
      console.error("[Supabase Server Action] Database transaction failed:", error);
      
      // Handle Postgres exceptions raised by register_participant_atomic
      if (error.message.includes("capacity_exhausted")) {
        return {
          success: false,
          error: "Selected event is full. Laboratory capacity has been reached.",
        };
      }
      if (error.message.includes("duplicate_registration")) {
        return {
          success: false,
          error: "You are already registered for this event scope.",
        };
      }
      if (error.message.includes("registration_closed")) {
        return {
          success: false,
          error: "Registration is currently closed.",
        };
      }
      if (error.message.includes("registration_deadline_passed")) {
        return {
          success: false,
          error: "The registration deadline has passed.",
        };
      }
      if (error.message.includes("festival_not_found")) {
        return {
          success: false,
          error: "Festival edition config mismatch.",
        };
      }
      if (error.message.includes("event_not_found")) {
        return {
          success: false,
          error: "Selected event has not been published or does not exist.",
        };
      }
      if (error.code === "23505") { // Unique key constraint breach (idempotency key clash)
        return {
          success: false,
          error: "A registration with this data has already been recorded.",
        };
      }

      return {
        success: false,
        error: "System transaction rejected. Please re-check details.",
      };
    }

    return {
      success: true,
      confirmationCode: data as string,
    };
  } catch (err: any) {
    console.error("[Supabase Server Action] Unhandled crash:", err);
    return {
      success: false,
      error: "Unexpected system breakdown. Core registry offline.",
    };
  }
}

// Verification helper for Cloudflare Turnstile bot protection
async function verifyTurnstileToken(token: string): Promise<{ success: boolean; error?: string }> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Turnstile Verification] TURNSTILE_SECRET_KEY is missing. Verification bypassed.");
    }
    return { success: true };
  }

  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret, response: token }),
    });
    
    const data = await res.json();
    return { 
      success: !!data.success, 
      error: data["error-codes"] ? data["error-codes"].join(", ") : undefined 
    };
  } catch (err) {
    console.error("[Turnstile Verification] Fetch error:", err);
    return { success: false, error: "Cloudflare Turnstile connection failed." };
  }
}
