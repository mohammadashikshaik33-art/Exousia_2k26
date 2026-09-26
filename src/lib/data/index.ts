/* eslint-disable @typescript-eslint/no-explicit-any */
import { FESTIVAL_INFO, MOCK_EVENTS, MOCK_VENUES, MOCK_COORDINATORS } from "@/data/events";
import { Event, Venue, Coordinator, FestivalEdition } from "@/types";
import { getSupabaseServerClient, getSupabaseStaticClient, isSupabaseServerConfigured } from "../supabase/server";

// Verify database configuration and manage production behavior vs dev sandbox
const ensureConfigured = (): boolean => {
  if (!isSupabaseServerConfigured()) {
    // Check if we are inside the production build compiler phase
    const isBuildTime = process.env.NEXT_PHASE === "phase-production-build";
    
    if (process.env.NODE_ENV === "production" && !isBuildTime) {
      throw new Error(
        "CRITICAL ANOMALY: Supabase credentials are not configured in this production environment. Operational databases are offline."
      );
    }
    
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[Supabase Data Access] Configuration missing. Falling back to local static mock datasets."
      );
    }
    return false;
  }
  return true;
};

// Helper to map DB event to our unified frontend interface
const mapDatabaseEvent = (dbEvent: any): Event => {
  const venue: Venue | undefined = dbEvent.venue ? {
    id: dbEvent.venue.id,
    name: dbEvent.venue.name,
    building: dbEvent.venue.building,
    room_number: dbEvent.venue.room_number || undefined,
    description: dbEvent.venue.description || undefined,
    coordinates: dbEvent.venue.coordinates || undefined
  } : undefined;

  // Map junction event_coordinators -> coordinators
  const coordinatorsDetails: Coordinator[] = dbEvent.event_coordinators
    ? dbEvent.event_coordinators.map((ec: any) => ec.coordinator).filter(Boolean)
    : [];

  const coordinators = coordinatorsDetails.map((c: Coordinator) => ({
    name: c.name,
    phone: c.phone || "",
    role: c.role || "Coordinator",
    email: c.email || ""
  }));

  return {
    id: dbEvent.id,
    festival_id: dbEvent.festival_id,
    slug: dbEvent.slug,
    title: dbEvent.title,
    category: dbEvent.category as "technical" | "spot" | "fun",
    discipline_tags: dbEvent.discipline_tags || [],
    day_number: dbEvent.day_number,
    day: dbEvent.day_number as (1 | 2),
    start_at: dbEvent.start_at,
    end_at: dbEvent.end_at,
    time: `${dbEvent.start_at} - ${dbEvent.end_at}`,
    date: dbEvent.day_number === 1 ? "Sept 18, 2026" : "Sept 19, 2026",
    venue_id: dbEvent.venue_id,
    venue: venue ? venue.name : "To Be Announced",
    venue_details: venue,
    short_description: dbEvent.short_description,
    shortDescription: dbEvent.short_description,
    full_description: dbEvent.full_description,
    description: dbEvent.full_description,
    objective: dbEvent.objective,
    rules: dbEvent.rules || [],
    eligibility: dbEvent.eligibility,
    team_min: dbEvent.team_min,
    team_max: dbEvent.team_max,
    teamSize: dbEvent.team_min === dbEvent.team_max 
      ? `${dbEvent.team_min} Member${dbEvent.team_min > 1 ? "s" : ""}` 
      : `${dbEvent.team_min}-${dbEvent.team_max} Members`,
    duration_minutes: dbEvent.duration_minutes,
    judging_criteria: dbEvent.judging_criteria || [],
    prize_label: dbEvent.prize_label,
    fee_minor: dbEvent.fee_minor,
    currency: dbEvent.currency,
    capacity: dbEvent.capacity,
    confirmed_count: dbEvent.confirmed_count,
    held_count: dbEvent.held_count,
    registration_mode: dbEvent.registration_mode as any,
    registration_status: dbEvent.registration_status as any,
    registrationStatus: dbEvent.registration_status === "open" ? "open" : dbEvent.registration_status === "full" ? "filled" : "closed",
    external_registration_url: dbEvent.external_registration_url || undefined,
    featured: dbEvent.featured,
    poster_asset_id: dbEvent.poster_asset_id || undefined,
    published: dbEvent.published,
    sort_order: dbEvent.sort_order,
    coordinators,
    coordinators_details: coordinatorsDetails,
  };
};

// 1. Fetch Published Festival Edition
export async function getPublishedFestival(): Promise<FestivalEdition | null> {
  if (!ensureConfigured()) {
    return {
      id: FESTIVAL_INFO.id,
      name: FESTIVAL_INFO.title,
      slug: "exousia-2026",
      year: FESTIVAL_INFO.year,
      theme: "Stranger Things",
      tagline: FESTIVAL_INFO.tagline,
      timezone: "Asia/Kolkata",
      starts_at: "2026-09-18T09:00:00+05:30",
      ends_at: "2026-09-19T17:00:00+05:30",
      registration_opens_at: "2026-08-15T00:00:00+05:30",
      registration_closes_at: FESTIVAL_INFO.registration_deadline,
      registration_status: "open",
      primary_venue_id: "v-foyer-hall",
      published: true
    };
  }

  const supabase = getSupabaseStaticClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("festival_editions")
    .select("*")
    .eq("published", true)
    .single();

  if (error) {
    console.error("[DataAccess] Error fetching festival edition:", error.message);
    if (process.env.NODE_ENV === "production") {
      throw new Error(`Database query failure: ${error.message}`);
    }
    return null;
  }

  return data;
}

// 2. Fetch Published Events
export async function getPublishedEvents(): Promise<Event[]> {
  if (!ensureConfigured()) {
    return MOCK_EVENTS;
  }

  const supabase = getSupabaseStaticClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("events")
    .select(`
      *,
      venue:venues(*),
      event_coordinators(
        coordinator:coordinators(*)
      )
    `)
    .eq("published", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("[DataAccess] Error fetching events:", error.message);
    if (process.env.NODE_ENV === "production") {
      throw new Error(`Database query failure: ${error.message}`);
    }
    return [];
  }

  return data.map(mapDatabaseEvent);
}

// 3. Fetch Event by Slug
export async function getEventBySlug(slug: string): Promise<Event | null> {
  if (!ensureConfigured()) {
    const event = MOCK_EVENTS.find((e) => e.slug === slug);
    return event || null;
  }

  const supabase = getSupabaseStaticClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("events")
    .select(`
      *,
      venue:venues(*),
      event_coordinators(
        coordinator:coordinators(*)
      )
    `)
    .eq("slug", slug)
    .eq("published", true)
    .single();

  if (error) {
    console.error(`[DataAccess] Error fetching event by slug (${slug}):`, error.message);
    if (process.env.NODE_ENV === "production") {
      throw new Error(`Database query failure: ${error.message}`);
    }
    return null;
  }

  return mapDatabaseEvent(data);
}

// 4. Fetch Venues Directory
export async function getVenues(): Promise<Venue[]> {
  if (!ensureConfigured()) {
    return MOCK_VENUES;
  }

  const supabase = getSupabaseStaticClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("venues")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error("[DataAccess] Error fetching venues:", error.message);
    if (process.env.NODE_ENV === "production") {
      throw new Error(`Database query failure: ${error.message}`);
    }
    return [];
  }

  return data;
}

// 5. Fetch Public Coordinators Directory
export async function getPublicCoordinators(): Promise<Coordinator[]> {
  if (!ensureConfigured()) {
    return MOCK_COORDINATORS;
  }

  const supabase = getSupabaseStaticClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("coordinators")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error("[DataAccess] Error fetching coordinators:", error.message);
    if (process.env.NODE_ENV === "production") {
      throw new Error(`Database query failure: ${error.message}`);
    }
    return [];
  }

  return data;
}
