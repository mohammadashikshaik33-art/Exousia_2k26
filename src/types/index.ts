export interface FestivalEdition {
  id: string;
  name: string;
  slug: string;
  year: number;
  theme: string;
  tagline: string;
  timezone: string;
  starts_at: string;
  ends_at: string;
  registration_opens_at: string;
  registration_closes_at: string;
  registration_status: "upcoming" | "open" | "closed" | "suspended";
  primary_venue_id: string;
  published: boolean;
}

export interface Venue {
  id: string;
  name: string;
  building: string;
  room_number?: string;
  description?: string;
  coordinates?: string;
}

export interface Coordinator {
  id: string;
  name: string;
  department: string;
  role: string;
  email?: string;
  phone?: string;
  avatar_url?: string;
}

export interface Event {
  id: string;
  festival_id: string;
  slug: string;
  title: string;
  category: "technical" | "spot" | "fun";
  discipline_tags: string[];
  day_number: number;
  day: 1 | 2; // Compatibility layer
  start_at: string;
  end_at: string;
  time: string; // Compatibility layer
  date: string; // Compatibility layer
  venue_id: string;
  venue: string; // Compatibility layer (string name)
  venue_details?: Venue; // DB object relation
  short_description: string;
  shortDescription: string; // Compatibility layer
  full_description: string;
  description: string; // Compatibility layer
  objective: string;
  rules: string[];
  eligibility: string;
  team_min: number;
  team_max: number;
  teamSize: string; // Compatibility layer
  duration_minutes: number;
  judging_criteria: string[];
  prize_label: string;
  fee_minor: number;
  currency: string;
  capacity: number;
  confirmed_count: number;
  held_count: number;
  registration_mode: "online" | "on-site" | "external" | "closed";
  registration_status: "open" | "closed" | "full";
  registrationStatus: "open" | "closed" | "filled"; // Compatibility layer
  external_registration_url?: string;
  featured: boolean;
  poster_asset_id?: string;
  published: boolean;
  sort_order: number;
  coordinators: { name: string; phone: string; role?: string; email?: string }[];
  coordinators_details?: Coordinator[];
}

export interface RegistrationItem {
  id: string;
  registration_id: string;
  event_id: string;
  individual_participant_id?: string;
  team_id?: string;
  status: "pending" | "confirmed" | "cancelled";
  fee_snapshot: number;
  timestamps: {
    created_at: string;
  };
}

export interface Payment {
  id: string;
  registration_id: string;
  provider: "razorpay";
  provider_order_id: string;
  provider_payment_id?: string;
  amount: number;
  currency: string;
  status: "pending" | "completed" | "failed";
  verified_at?: string;
}
