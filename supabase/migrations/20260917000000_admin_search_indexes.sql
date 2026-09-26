-- EXOUSIA Admin Search & Filtering Migration
-- Indexes added for performance optimization on event and status multi-field admin queries

CREATE INDEX IF NOT EXISTS idx_registrations_selected_event ON public.registrations(selected_event);
CREATE INDEX IF NOT EXISTS idx_registrations_status ON public.registrations(status);
