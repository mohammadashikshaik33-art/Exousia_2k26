-- Seed data for EXOUSIA 2026
-- Department of Electrical & Electronics Engineering (EEE)

-- 1. Insert Venues
insert into public.venues (id, name, building, room_number, description, coordinates) values
('c4e09f5e-1a22-4a0b-8d07-8e6dfd158700', 'Electrical Machinery Laboratory', 'EEE Block - Ground Floor', 'G-04', 'Equipped with industrial DC/AC stator setups, variable loads, and high-amp stabilizers.', 'BLOCK_EEE_G04'),
('a5e01f5e-1a22-4a0b-8d07-8e6dfd158701', 'Embedded Systems Laboratory', 'EEE Block - First Floor', 'F-12', 'Features FPGA boards, ESP32 microcontrollers, digital logic oscilloscopes, and testing benches.', 'BLOCK_EEE_F12'),
('f6e01f5e-1a22-4a0b-8d07-8e6dfd158702', 'EEE Department Foyer', 'EEE Block - Ground Floor Main Entrance', 'Entrance Area', 'Spacious central atrium containing telemetry banners and visual projects exhibitions.', 'BLOCK_EEE_FOYER'),
('b7e01f5e-1a22-4a0b-8d07-8e6dfd158703', 'Seminar Hall B', 'EEE Block - Second Floor', 'S-22', 'Equipped with projection facilities, audio staging, and atmospheric blackouts.', 'BLOCK_EEE_S22'),
('d8e01f5e-1a22-4a0b-8d07-8e6dfd158704', 'Central Auditorium', 'VVIT Main Admin Block', 'Ground Floor', 'Prestige auditorium with multi-thousand seating and cinematic projection settings.', 'ADMIN_MAIN_AUDITORIUM');

-- 2. Insert Coordinators
insert into public.coordinators (id, name, department, role, email, phone) values
('f1a1d1e5-8201-4494-8820-c4e09f5e1a20', 'Rohan Varma', 'EEE - Final Year', 'General Student Lead', 'rohan.eee@vvit.edu.in', '+91 94945 88201'),
('f2a1d1e5-8201-4494-8820-c4e09f5e1a21', 'Ananya Rao', 'EEE - Third Year', 'Technical Registrations Coordinator', 'ananya.eee@vvit.edu.in', '+91 91002 99381'),
('f3a1d1e5-8201-4494-8820-c4e09f5e1a22', 'Kartik Sen', 'EEE - Final Year', 'Hardware Lab In-charge', 'kartik.eee@vvit.edu.in', '+91 98827 77312'),
('f4a1d1e5-8201-4494-8820-c4e09f5e1a23', 'Meera Nair', 'EEE - Third Year', 'Event Operations Support', 'meera.eee@vvit.edu.in', '+91 94921 55632');

-- 3. Insert Festival Edition
insert into public.festival_editions (id, name, slug, year, theme, tagline, starts_at, ends_at, registration_opens_at, registration_closes_at, registration_status, primary_venue_id, published) values
('e1801f5e-1a22-4a0b-8d07-8e6dfd158700', 'EXOUSIA', 'exousia-2026', 2026, 'Stranger Things', 'WHEN THE CURRENT CROSSES OVER.', '2026-09-18T09:00:00+05:30', '2026-09-19T17:00:00+05:30', '2026-08-15T00:00:00+05:30', '2026-09-17T23:59:59+05:30', 'open', 'f6e01f5e-1a22-4a0b-8d07-8e6dfd158702', true);

-- 4. Insert Events
insert into public.events (id, festival_id, slug, title, category, discipline_tags, day_number, start_at, end_at, venue_id, short_description, full_description, objective, rules, eligibility, team_min, team_max, duration_minutes, judging_criteria, prize_label, fee_minor, currency, capacity, confirmed_count, held_count, registration_mode, registration_status, featured, published, sort_order) values
(
  'e2801f5e-1a22-4a0b-8d07-8e6dfd158701',
  'e1801f5e-1a22-4a0b-8d07-8e6dfd158700',
  'circuit-scramble',
  'Circuit Scramble',
  'technical',
  array['analog circuits', 'debugging', 'power design'],
  1,
  '10:00 AM',
  '12:30 PM',
  'c4e09f5e-1a22-4a0b-8d07-8e6dfd158700',
  'Debug and build functional analog circuits under extreme conditions and signal noise.',
  'Participants are tested on their core circuit debugging speed, component identification, and ability to reconstruct active filtering circuits from corrupted schematics under simulated electrical load anomalies.',
  'Reconstruct a noise-filtering operational amplifier grid within 45 minutes of schematic lock.',
  array[
    'Individual entries or teams of maximum 2 members are permitted.',
    'Use of external internet, mobile lookup, or pre-programmed calculators is restricted.',
    'Round 1 consists of a timed theoretical test; Round 2 is hands-on hardware implementation.'
  ],
  'Engineering students currently pursuing EEE, ECE, EIE or Mechatronics streams.',
  1,
  2,
  150,
  array[
    'Stabilized wave phase accuracy (50%)',
    'Efficiency of passive components selection (30%)',
    'Completion time and circuit safety standards (20%)'
  ],
  'Prestige EEE Department Shield & Honor Medals',
  0,
  'INR',
  50,
  14,
  0,
  'online',
  'open',
  true,
  true,
  1
),
(
  'e2801f5e-1a22-4a0b-8d07-8e6dfd158702',
  'e1801f5e-1a22-4a0b-8d07-8e6dfd158700',
  'inversion-hack',
  'Phase Inversion Hackathon',
  'technical',
  array['embedded systems', 'firmware', 'grid protection'],
  2,
  '09:30 AM',
  '04:00 PM',
  'a5e01f5e-1a22-4a0b-8d07-8e6dfd158701',
  'A specialized embedded systems hackathon to control grid anomaly detection systems.',
  'Write microcontroller firmware in C/C++ or MicroPython to synchronize sensors, identify signal phase shifts, and stabilize simulated microgrid failure scenarios on active ESP32-based hardware kits.',
  'Deploy a real-time interrupt-based phase monitoring daemon on the provided ESP32 controller.',
  array[
    'Teams of 2 to 4 members are required.',
    'Hardware kits (ESP32 plus relays and signal injectors) will be provided at the venue.',
    'Submissions must compile under standard GCC toolchains without external proprietary libraries.'
  ],
  'Open to all engineering undergraduates with basic microcontroller knowledge.',
  2,
  4,
  390,
  array[
    'Firmware interrupt response latency (40%)',
    'Power consumption optimization under active loads (30%)',
    'Algorithm reliability under transient grid shifts (30%)'
  ],
  'VVIT Prestige Embedded Tech Trophy & Certificates',
  0,
  'INR',
  30,
  8,
  0,
  'online',
  'open',
  true,
  true,
  2
),
(
  'e2801f5e-1a22-4a0b-8d07-8e6dfd158703',
  'e1801f5e-1a22-4a0b-8d07-8e6dfd158700',
  'vector-oscillography',
  'Vector Oscillography',
  'spot',
  array['oscilloscopes', 'Lissajous figures', 'signal art'],
  1,
  '10:00 AM',
  '04:00 PM',
  'f6e01f5e-1a22-4a0b-8d07-8e6dfd158702',
  'Draw creative vector waveforms using function generators and analog oscilloscopes.',
  'Generate XY-mode Lissajous patterns and mathematical vector drawings on analog cathode-ray tube screens by tuning dual frequency signal generators.',
  'Match target Lissajous grids and compose custom creative vector art using frequency signals.',
  array[
    'Walk-in spot registrations only. No advance online entry is required.',
    'Time limit of 15 minutes per participant setup.',
    'Waveforms must be stabilized on CRT screen to qualify for final snaps.'
  ],
  'Open to all festival attendees.',
  1,
  1,
  15,
  array[
    'Mathematical complexity of Lissajous formations (60%)',
    'Wave stabilization control and frequency lock speed (40%)'
  ],
  'Best Oscillogram Plaque & Merits',
  0,
  'INR',
  100,
  0,
  0,
  'on-site',
  'open',
  false,
  true,
  3
),
(
  'e2801f5e-1a22-4a0b-8d07-8e6dfd158704',
  'e1801f5e-1a22-4a0b-8d07-8e6dfd158700',
  'strange-flux',
  'Strange Flux Escape Room',
  'fun',
  array['logic locks', 'electromagnetism', 'puzzles'],
  1,
  '11:00 AM',
  '03:00 PM',
  'b7e01f5e-1a22-4a0b-8d07-8e6dfd158703',
  'An alternate-reality escape room with electrical puzzle locks and logic gates.',
  'Solve a sequence of logic gate configurations and electromagnetic induction locks inside a dark room with red atmospheric cues to restore power and ''escape'' from the inverted field.',
  'De-energize the central electromagnetic clamp by verifying logical outputs on the gate switchboard.',
  array[
    'Teams must consist of exactly 3 members.',
    'Time limit of 20 minutes to solve all sequential logic panels.',
    'No physical forcing, component extraction, or toolsets allowed inside the room.'
  ],
  'Open to all branches and years.',
  3,
  3,
  20,
  array[
    'Fastest escape and system restore time (100%)'
  ],
  'Logic Masters Shield & Event Badges',
  0,
  'INR',
  40,
  12,
  0,
  'online',
  'open',
  true,
  true,
  4
);

-- 5. Insert Junction Event Coordinators
insert into public.event_coordinators (event_id, coordinator_id) values
('e2801f5e-1a22-4a0b-8d07-8e6dfd158701', 'f3a1d1e5-8201-4494-8820-c4e09f5e1a22'), -- Circuit Scramble -> Kartik Sen
('e2801f5e-1a22-4a0b-8d07-8e6dfd158702', 'f1a1d1e5-8201-4494-8820-c4e09f5e1a20'), -- Inversion Hack -> Rohan Varma
('e2801f5e-1a22-4a0b-8d07-8e6dfd158703', 'f4a1d1e5-8201-4494-8820-c4e09f5e1a23'), -- Vector Oscillography -> Meera Nair
('e2801f5e-1a22-4a0b-8d07-8e6dfd158704', 'f2a1d1e5-8201-4494-8820-c4e09f5e1a21'); -- Strange Flux -> Ananya Rao
