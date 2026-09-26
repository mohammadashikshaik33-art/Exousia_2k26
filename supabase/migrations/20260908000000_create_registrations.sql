-- EXOUSIA Production Registrations Table Schema (Corrected Data Model)
-- Optimized for 10,000+ High-Concurrency Submissions

CREATE TABLE IF NOT EXISTS public.registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_id VARCHAR(32) NOT NULL UNIQUE,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    college VARCHAR(255) NOT NULL,
    selected_event VARCHAR(100) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'REGISTERED',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- Composite Uniqueness: One email can register for different events, but not the same event twice
    CONSTRAINT unq_email_selected_event UNIQUE (email, selected_event)
);

-- Indexing for fast lookups under 10,000+ participant load
CREATE INDEX IF NOT EXISTS idx_registrations_created_at ON public.registrations(created_at DESC);

-- Automatic updated_at timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS set_registrations_updated_at ON public.registrations;
CREATE TRIGGER set_registrations_updated_at
BEFORE UPDATE ON public.registrations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

-- Allow public insertion via serverless API
CREATE POLICY "Allow public registration insert" 
ON public.registrations 
FOR INSERT 
WITH CHECK (true);

-- Restrict direct public read access (Only service_role can query)
CREATE POLICY "Restrict public read" 
ON public.registrations 
FOR SELECT 
USING (auth.role() = 'service_role');
