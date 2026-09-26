-- EXOUSIA Phase 9.6 Migration: Fix status default to 'REGISTERED' and remove redundant index
-- Purpose: Harmonize database schema with application contract and eliminate write overhead of duplicate index.

-- 1. Update column default for status from 'CONFIRMED' to canonical 'REGISTERED'
ALTER TABLE public.registrations ALTER COLUMN status SET DEFAULT 'REGISTERED';

-- 2. Drop redundant index (unq_email_selected_event UNIQUE constraint already creates an identical B-Tree index)
DROP INDEX IF EXISTS public.idx_registrations_email_event;
